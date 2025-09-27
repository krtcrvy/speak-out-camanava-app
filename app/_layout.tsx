<<<<<<< Updated upstream
import '../global.css';
=======
// layout.tsx

import "../global.css";
import { Slot, Stack, useRouter, useSegments } from "expo-router";
import { PhotoProvider } from "~/components/layouts/auth/photo-context";
import { SignUpProvider } from "~/components/layouts/auth/signup-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { Vibration, Platform, View, ActivityIndicator } from "react-native";
import { registerForPushNotificationsAsync } from "~/utils/registerPush";
import { startBackgroundLocation } from "~/tasks/locationTask";
import { supabase } from "~/utils/supabase";

import {
  Poppins_100Thin,
  Poppins_100Thin_Italic,
  Poppins_200ExtraLight,
  Poppins_200ExtraLight_Italic,
  Poppins_300Light,
  Poppins_300Light_Italic,
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_500Medium_Italic,
  Poppins_600SemiBold,
  Poppins_600SemiBold_Italic,
  Poppins_700Bold,
  Poppins_700Bold_Italic,
  Poppins_800ExtraBold,
  Poppins_800ExtraBold_Italic,
  Poppins_900Black,
  Poppins_900Black_Italic,
} from "@expo-google-fonts/poppins";
>>>>>>> Stashed changes

import {
  Inter_100Thin,
  Inter_100Thin_Italic,
  Inter_200ExtraLight,
  Inter_200ExtraLight_Italic,
  Inter_300Light,
  Inter_300Light_Italic,
  Inter_400Regular,
  Inter_400Regular_Italic,
  Inter_500Medium,
  Inter_500Medium_Italic,
  Inter_600SemiBold,
  Inter_600SemiBold_Italic,
  Inter_700Bold,
  Inter_700Bold_Italic,
  Inter_800ExtraBold,
  Inter_800ExtraBold_Italic,
  Inter_900Black,
  Inter_900Black_Italic,
<<<<<<< Updated upstream
} from '@expo-google-fonts/inter';
import {
  Poppins_100Thin,
  Poppins_100Thin_Italic,
  Poppins_200ExtraLight,
  Poppins_200ExtraLight_Italic,
  Poppins_300Light,
  Poppins_300Light_Italic,
  Poppins_400Regular,
  Poppins_400Regular_Italic,
  Poppins_500Medium,
  Poppins_500Medium_Italic,
  Poppins_600SemiBold,
  Poppins_600SemiBold_Italic,
  Poppins_700Bold,
  Poppins_700Bold_Italic,
  Poppins_800ExtraBold,
  Poppins_800ExtraBold_Italic,
  Poppins_900Black,
  Poppins_900Black_Italic,
} from '@expo-google-fonts/poppins';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

=======
} from "@expo-google-fonts/inter";

// ✅ keep splash until fonts/setup ready
SplashScreen.preventAutoHideAsync().catch(() => {});

// ✅ Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, // iOS
    shouldShowList: true,   // iOS summary
  }),
});

async function requestNotificationPermission() {
  if (Platform.OS === "android") {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      await Notifications.requestPermissionsAsync();
    }
  }
}

async function ensureNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("camanava-alerts", {
      name: "Camanava Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 500, 200, 500],
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

>>>>>>> Stashed changes
export default function Layout() {
  const [loaded, error] = useFonts({
    // Poppins
    Poppins_100Thin,
    Poppins_100Thin_Italic,
    Poppins_200ExtraLight,
    Poppins_200ExtraLight_Italic,
    Poppins_300Light,
    Poppins_300Light_Italic,
    Poppins_400Regular,
    Poppins_400Regular_Italic,
    Poppins_500Medium,
    Poppins_500Medium_Italic,
    Poppins_600SemiBold,
    Poppins_600SemiBold_Italic,
    Poppins_700Bold,
    Poppins_700Bold_Italic,
    Poppins_800ExtraBold,
    Poppins_800ExtraBold_Italic,
    Poppins_900Black,
    Poppins_900Black_Italic,

    // Inter
    Inter_100Thin,
    Inter_100Thin_Italic,
    Inter_200ExtraLight,
    Inter_200ExtraLight_Italic,
    Inter_300Light,
    Inter_300Light_Italic,
    Inter_400Regular,
    Inter_400Regular_Italic,
    Inter_500Medium,
    Inter_500Medium_Italic,
    Inter_600SemiBold,
    Inter_600SemiBold_Italic,
    Inter_700Bold,
    Inter_700Bold_Italic,
    Inter_800ExtraBold,
    Inter_800ExtraBold_Italic,
    Inter_900Black,
    Inter_900Black_Italic,
  });

<<<<<<< Updated upstream
=======
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const setupCompleteRef = useRef(false);

  // ✅ Check authentication state
>>>>>>> Stashed changes
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("🔍 Initial auth check - Session exists:", !!session);
        setHasSession(!!session);
      } catch (err) {
        console.error("❌ Error checking auth:", err);
        setHasSession(false);
      } finally {
        setIsAuthChecked(true);
      }
    };

<<<<<<< Updated upstream
  if (!loaded && !error) {
    return null;
  }
  return <Stack />;
}
=======
    checkAuth();
  }, []);

  // ✅ Setup notifications and background tasks
  useEffect(() => {
    if (!loaded || !isAuthChecked || setupCompleteRef.current) return;

    console.log("🚀 Setting up notifications and background tasks...");

    const setupApp = async () => {
      try {
        await requestNotificationPermission();
        await ensureNotificationChannel();
        
        // Only start background location if user has session
        if (hasSession) {
          console.log("📍 Starting background location for authenticated user");
          await startBackgroundLocation();
          
          // Register push notifications for authenticated user with proper waiting
          console.log("📱 Registering push notifications...");
          await registerForPushNotificationsAsync();
        }

        // Foreground notifications
        notificationListener.current =
          Notifications.addNotificationReceivedListener(() => {
            Vibration.vibrate([500, 200, 500]);
          });

        // User taps a notification
        responseListener.current =
          Notifications.addNotificationResponseReceivedListener(() => {
            Vibration.vibrate([500, 200, 500]);
            // Later: navigate user into incident/safety screen
          });

        console.log("✅ All setup complete");
        setupCompleteRef.current = true;
        setIsSetupComplete(true);
      } catch (error) {
        console.error("❌ Setup error:", error);
        // Still mark as complete to avoid blocking the app
        setupCompleteRef.current = true;
        setIsSetupComplete(true);
      }
    };

    setupApp();

    // ✅ Improved Auth State Change Handler
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`🔑 Auth state changed: ${event}`, session?.user?.id ? `UID: ${session.user.id}` : 'No UID');
        
        setHasSession(!!session);

        // Handle both SIGNED_IN and INITIAL_SESSION events
        if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
          console.log("🔑 User session detected, refreshing push token...");
          
          // Start background location after sign in
          setTimeout(async () => {
            console.log("📍 Starting background location after sign in");
            await startBackgroundLocation();
          }, 1000);
          
          // Register push notifications with delay to ensure session is ready
          setTimeout(async () => {
            console.log("⏰ Delayed token refresh after session detection");
            await registerForPushNotificationsAsync();
          }, 2000);
        }
        
        if (event === "SIGNED_OUT") {
          console.log("🚪 User signed out, clearing push token...");
          // Use the session from the event instead of current session
          const uid = session?.user?.id;
          if (uid) {
            const { error } = await supabase
              .from("users")
              .update({ expo_push_token: null })
              .eq("uid", uid);
            if (error) {
              console.error("❌ Failed to clear token:", error.message);
            } else {
              console.log("✅ Token cleared for UID:", uid);
            }
          } else {
            console.log("⚠️ No UID available to clear token");
          }
        }
        
        if (event === "TOKEN_REFRESHED") {
          console.log("🔄 Token refreshed, updating push token...");
          // Also update push token when auth token is refreshed
          setTimeout(async () => {
            await registerForPushNotificationsAsync();
          }, 1000);
        }
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      authListener?.subscription.unsubscribe();
    };
  }, [loaded, isAuthChecked, hasSession]);

  // ✅ hide splash when fonts ready AND auth checked AND setup complete
  useEffect(() => {
    if ((loaded || error) && isAuthChecked && isSetupComplete) {
      console.log("✅ All resources loaded and setup complete, hiding splash screen");
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [loaded, error, isAuthChecked, isSetupComplete]);

  // ✅ Redirect based on authentication state (only after setup is complete)
  useEffect(() => {
    if (!isAuthChecked || !isSetupComplete) return;

    const inAuthGroup = segments[0] === "(auth)";

    console.log("🔄 Routing check:", {
      hasSession,
      inAuthGroup,
      currentSegment: segments[0],
      isSetupComplete
    });

    if (hasSession === false && !inAuthGroup) {
      // No session - redirect to get-started
      console.log("🚫 No session found, redirecting to get-started");
      router.replace("/(auth)/sign-up/get-started");
    } else if (hasSession === true && inAuthGroup) {
      // Has session but in auth group - redirect to app
      console.log("✅ Session found, redirecting to app");
      // Small delay to ensure everything is settled
      setTimeout(() => {
        router.replace("/(auth)/sign-up/pin-user");
      }, 500);
    }
  }, [hasSession, segments, isAuthChecked, isSetupComplete]);

  // ✅ Show loading screen until everything is ready
  if (!loaded || !isAuthChecked || !isSetupComplete) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#ffffff' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    console.error("❌ Font loading error:", error);
  }

  // Fix for the warning about Layout children
  return (
    <SignUpProvider>
      <PhotoProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </PhotoProvider>
    </SignUpProvider>
  );
}
>>>>>>> Stashed changes
