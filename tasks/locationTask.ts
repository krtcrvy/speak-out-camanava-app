import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import * as Location from "expo-location";
import { getDistance } from "geolib";
import { supabase } from "~/utils/supabase";
import { loadUserSettings } from "~/utils/userSettings";
import { ToastAndroid, Platform, Alert, AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const TASK_NAME = "locationTask";

// 🟢 Ensure Android notification channel exists
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("camanava-alerts", {
    name: "SpeakOut CAMANAVA Alerts",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [500, 200, 500],
    sound: "default",
  });
}

function debugLog(message: string) {
  console.log(message);

  // Foreground debugging (toast/alert)
  if (AppState.currentState === "active") {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("Debug", message);
    }
  }
}

TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) {
    debugLog("❌ locationTask error");
    return;
  }

  const { locations } = data as any;
  const userLocation = locations?.[0]?.coords;
  if (!userLocation) {
    debugLog("⚠️ No user location available");
    return;
  }

  debugLog(`📍 User: ${userLocation.latitude},${userLocation.longitude}`);

  // 🟢 Save latest location for Maps screen to consume
  try {
    await AsyncStorage.setItem(
      "latestUserLocation",
      JSON.stringify({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        timestamp: Date.now(),
      })
    );
  } catch (err) {
    console.error("❌ Failed to save latestUserLocation:", err);
  }

  // 🟢 Check if user logged in
  const { data: sessionData } = await supabase.auth.getSession();
  const uid = sessionData?.session?.user?.id;
  if (!uid) {
    debugLog("⚠️ No active session, skipping task");
    return;
  }

  // 🟢 Load and normalize user settings
  const rawSettings = await loadUserSettings(uid);
  if (!rawSettings) {
    debugLog("⚠️ No user settings found");
    return;
  }

  const settings = {
    notifySafety: Boolean(rawSettings.notifySafety),
    notifyIncidents: Boolean(rawSettings.notifyIncidents),
    detectionRadius: Number(rawSettings.detectionRadius) || 200,
    showReminders: Boolean(rawSettings.showReminders),
    pin_theft: rawSettings.pinTypes?.theft ?? true,
    pin_sexual: rawSettings.pinTypes?.sexual ?? true,
    pin_disorderly: rawSettings.pinTypes?.disorderly ?? true,
  };

  const {
    notifySafety,
    notifyIncidents,
    detectionRadius,
    showReminders,
    pin_theft,
    pin_sexual,
    pin_disorderly,
  } = settings;

  const pinTypes: Record<string, boolean> = {
    theft: pin_theft,
    sexual: pin_sexual,
    disorderly: pin_disorderly,
  };

  debugLog(`⚙️ Settings loaded: radius=${detectionRadius}`);

  // 🟢 Fetch incidents + safety tips
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL}/api/incidents/list`
  );
  const { incidents, safetyTips } = await response.json();

  debugLog(`📡 Got ${incidents.length} incidents, ${safetyTips.length} tips`);

  // Optionally cache them for Maps to read
  try {
    await AsyncStorage.setItem(
      "latestIncidentsAndTips",
      JSON.stringify({
        incidents,
        safetyTips,
        timestamp: Date.now(),
      })
    );
  } catch (err) {
    console.error("❌ Failed to save incidents/tips:", err);
  }

  const all = [
    ...incidents.map((i: any) => ({ ...i, type: "incident" })),
    ...safetyTips.map((t: any) => ({ ...t, type: "safety" })),
  ];

  for (const item of all) {
    const distance = getDistance(
      { latitude: userLocation.latitude, longitude: userLocation.longitude },
      { latitude: item.latitude, longitude: item.longitude }
    );

    debugLog(
      `📏 ${item.type} ${item.iid || ""}: ${distance}m (radius=${detectionRadius})`
    );

    if (distance > detectionRadius) {
      debugLog(`❌ Outside radius → ${item.type} ${item.iid}`);
      continue;
    }

    // 🟢 Filters
    if (item.type === "incident" && !notifyIncidents) {
      debugLog("🚫 Skip: incidents disabled");
      continue;
    }
    if (item.type === "safety" && (!notifySafety || !showReminders)) {
      debugLog("🚫 Skip: safety disabled");
      continue;
    }
    if (
      item.type === "incident" &&
      !pinTypes[item.type_of_incident?.toLowerCase() ?? ""]
    ) {
      debugLog(
        `🚫 Skip: incident type "${item.type_of_incident}" disabled in filters`
      );
      continue;
    }

    // 🟢 Foreground → Toast, Background → Notification
    try {
      if (AppState.currentState === "active") {
        debugLog(`🔔 Foreground toast → ${item.type} ${item.iid}`);
        if (Platform.OS === "android") {
          ToastAndroid.show(
            `${item.type.toUpperCase()} nearby (${distance}m)`,
            ToastAndroid.LONG
          );
        } else {
          Alert.alert(
            `${item.type.toUpperCase()} nearby (${distance}m)`,
            item.description || "Stay alert in your area."
          );
        }
      } else {
        debugLog(`🔔 Background notif → ${item.type} ${item.iid}`);
        await Notifications.scheduleNotificationAsync({
          content: {
            title:
              item.type === "incident"
                ? `Incident Nearby (${distance}m)`
                : `Safety Tip Nearby (${distance}m)`,
            body: item.description || "Stay alert in your area.",
            sound: "default",
            data: {
              ...(item.type === "incident"
                ? { incidentId: String(item.iid) }
                : { safetyId: String(item.iid) }),
              latitude: String(item.latitude),
              longitude: String(item.longitude),
            },
          },
          trigger: null,
          android: {
            channelId: "camanava-alerts",
          },
        } as any);
      }
    } catch (notifErr) {
      debugLog(`❌ Failed to send alert: ${notifErr}`);
    }
  }
});

export async function startBackgroundLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    debugLog("❌ Foreground location not granted");
    return;
  }

  const bgStatus = await Location.requestBackgroundPermissionsAsync();
  if (bgStatus.status !== "granted") {
    debugLog("❌ Background location not granted");
    return;
  }

  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (isRunning) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
    debugLog("🔄 Restarting locationTask...");
  }

  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 10000, // every 10s
    distanceInterval: 0,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "SpeakOut CAMANAVA",
      notificationBody: "Monitoring safety alerts in your area",
      notificationColor: "#4CAF50",
    },
  });

  debugLog("✅ locationTask started with persistent notif");
}

export async function ensureLocationServiceRunning() {
  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  debugLog(`🛠 ensureLocationServiceRunning: ${isRunning}`);
  if (!isRunning) {
    await startBackgroundLocation();
  }
}
