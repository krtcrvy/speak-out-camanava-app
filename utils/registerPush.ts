// utils/registerPush.ts
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { supabase } from "~/utils/supabase";

// Configure notification handler for better Android support
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    priority: Notifications.AndroidNotificationPriority.HIGH,
    shouldShowBanner: true, // iOS specific
    shouldShowList: true,   // iOS specific
  }),
});

export async function registerForPushNotificationsAsync() {
  console.log("🚀 STARTING push notification registration...");

  // Check if on physical device
  if (!Device.isDevice) {
    console.log("⚠️ Must use physical device for Push Notifications");
    return null;
  }

  try {
    // Android-specific FCM setup
    if (Platform.OS === "android") {
      try {
        await Notifications.setNotificationChannelAsync("default", {
          name: "Default Notifications",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#4CAF50",
          sound: "default",
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
        
        await Notifications.setNotificationChannelAsync("camanava-alerts", {
          name: "Safety Alerts",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 500, 200, 500],
          lightColor: "#FF3B30",
          sound: "default",
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });
        console.log("✅ Android notification channels created");
      } catch (channelError) {
        console.log("⚠️ Could not create notification channels (normal for first run):", channelError);
      }
    }

    // Check current permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== "granted") {
      console.log("📋 Requesting notification permissions...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("❌ Notification permission not granted");
      return null;
    }

    console.log("✅ Notification permission granted, getting Expo push token...");
    
    let token;
    try {
      // Get the push token with project ID for better FCM support
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: "c844463a-280a-4a05-b6ce-f75c24e0de9f", // Your EAS project ID
      });
      token = tokenData.data;
      console.log("📱 Expo Push Token:", token);
    } catch (tokenError) {
      console.error("❌ Failed to get Expo push token (FCM may not be set up yet):", tokenError);
      return null;
    }

    if (!token) {
      console.log("❌ No push token available");
      return null;
    }

    // Save token to Supabase
    return await saveTokenToSupabase(token);

  } catch (error) {
    console.error("❌ Error in push notification registration:", error);
    // Don't crash the app if notifications fail
    return null;
  }
}

async function saveTokenToSupabase(token: string) {
  try {
    console.log("💾 Attempting to save token to Supabase...");
    
    // Try multiple methods to get the current user
    let uid: string | null = null;
    
    // Method 1: Get user directly
    try {
      const { data: { user } } = await supabase.auth.getUser();
      uid = user?.id || null;
      console.log("🔍 User from auth.getUser():", uid ? `UID: ${uid}` : 'No user');
    } catch (userError) {
      console.log("⚠️ getUser() failed, trying session...");
    }

    // Method 2: Get session if user not available
    if (!uid) {
      try {
        const { data: session } = await supabase.auth.getSession();
        uid = session?.session?.user?.id || null;
        console.log("🔍 Session from auth.getSession():", uid ? `UID: ${uid}` : 'No session');
      } catch (sessionError) {
        console.log("❌ Both getUser() and getSession() failed");
      }
    }

    if (!uid) {
      console.log("⚠️ No UID available, will try again later");
      return token;
    }

    console.log("✅ Saving token for UID:", uid);

    // Use upsert as the primary method (simpler and more reliable)
    const { error: upsertError } = await supabase
      .from("users")
      .upsert({ 
        uid: uid,
        expo_push_token: token,
        updated_at: new Date().toISOString(),
        last_location_at: new Date().toISOString()
      }, {
        onConflict: 'uid'
        // Note: onConflictUpdate is not a valid option in Supabase JS client
      });

    if (upsertError) {
      console.error("❌ Upsert failed:", upsertError.message);
      
      // Fallback: Try individual insert/update
      await fallbackTokenSave(uid, token);
    } else {
      console.log("✅ Token saved successfully via upsert");
    }

    return token;

  } catch (error) {
    console.error("❌ Error saving token to Supabase:", error);
    return null;
  }
}

async function fallbackTokenSave(uid: string, token: string) {
  try {
    console.log("🔄 Trying fallback token save methods...");
    
    // First try update
    const { error: updateError } = await supabase
      .from("users")
      .update({ expo_push_token: token })
      .eq("uid", uid);

    if (updateError) {
      console.log("⚠️ Update failed, trying insert...");
      
      // Then try insert
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ 
          uid: uid, 
          expo_push_token: token,
          created_at: new Date().toISOString(),
          last_location_at: new Date().toISOString()
        }]);

      if (insertError) {
        console.error("❌ All token save methods failed:", insertError.message);
      } else {
        console.log("✅ Token saved via insert fallback");
      }
    } else {
      console.log("✅ Token saved via update fallback");
    }
  } catch (error) {
    console.error("❌ Fallback save also failed:", error);
  }
}

// Enhanced manual token refresh with retry logic
export async function refreshPushTokenAfterLogin() {
  console.log("🔄 Manual push token refresh triggered");
  
  // Wait a bit for auth to fully settle
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    const result = await registerForPushNotificationsAsync();
    if (!result) {
      console.log("⚠️ First refresh attempt failed, retrying in 3 seconds...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      return await registerForPushNotificationsAsync();
    }
    console.log("✅ Manual token refresh completed");
    return result;
  } catch (error) {
    console.error("❌ Manual token refresh failed:", error);
    return null;
  }
}

// Enhanced clear push token function
export async function clearPushToken() {
  try {
    console.log("🧹 Clearing push token...");
    
    const { data: { user } } = await supabase.auth.getUser();
    const uid = user?.id;

    if (!uid) {
      console.log("⚠️ No user found to clear token");
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({ 
        expo_push_token: null,
        updated_at: new Date().toISOString()
      })
      .eq("uid", uid);

    if (error) {
      console.error("❌ Failed to clear token:", error.message);
    } else {
      console.log("✅ Push token cleared for UID:", uid);
    }
  } catch (err) {
    console.error("❌ Error clearing push token:", err);
  }
}

// Test notification function (useful for debugging)
export async function sendTestNotification() {
  try {
    console.log("🔔 Sending test notification...");
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "SpeakOut CAMANAVA Test",
        body: "This is a test notification! 🎉",
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: 'timeInterval',
        seconds: 2,
      } as Notifications.TimeIntervalTriggerInput,
    });
    console.log("✅ Test notification scheduled");
  } catch (error) {
    console.error("❌ Failed to send test notification:", error);
  }
}

// Check if notifications are supported and configured
export async function checkNotificationSupport() {
  try {
    // For expo-notifications, we check permissions directly
    const permissions = await Notifications.getPermissionsAsync();
    
    console.log("📱 Notification Support Check:", {
      permissions: permissions.status,
      granted: permissions.granted,
    });
    
    return permissions.granted;
  } catch (error) {
    console.error("❌ Error checking notification support:", error);
    return false;
  }
}

// Check if we can send notifications (simpler version)
export async function canSendNotifications() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error("❌ Error checking notification permissions:", error);
    return false;
  }
}