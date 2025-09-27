// tasks/locationTask.ts
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "~/utils/supabase";
import { Platform, ToastAndroid } from "react-native";

const TASK_NAME = "background-location-task";

TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("❌ Task error:", error);
    return;
  }

  const { locations } = data as any;
  const coords = locations?.[0]?.coords;
  if (!coords) return;

  console.log(`📍 Location update: lat=${coords.latitude}, lon=${coords.longitude}`);
  await AsyncStorage.setItem("latestUserLocation", JSON.stringify(coords));

  try {
    const { data: session } = await supabase.auth.getSession();
    const uid = session?.session?.user?.id;

    if (!uid) {
      console.log("⚠️ No session found, skipping location update");
      return;
    }

    const { error: dbError } = await supabase
      .from("users")
      .update({
        last_lat: coords.latitude,
        last_lng: coords.longitude,
        last_location_at: new Date().toISOString(),
      })
      .eq("uid", uid);

    if (dbError) {
      console.error("❌ Supabase location update failed:", dbError.message);
    } else {
      console.log("✅ Location updated for UID:", uid);
    }
  } catch (err) {
    console.error("❌ Unexpected error during location upload:", err);
  }
});

export async function startBackgroundLocation() {
  console.log("🚀 Starting background location...");

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") return;

  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== "granted") return;

  const isRunning = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (isRunning) {
    console.log("ℹ️ Already running");
    return;
  }

  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.High,
    timeInterval: 60000,
    distanceInterval: 50,
    foregroundService: {
      notificationTitle: "SpeakOut CAMANAVA",
      notificationBody: "Sharing your location for alerts",
      notificationColor: "#4CAF50",
    },
    pausesUpdatesAutomatically: false,
  });

  if (Platform.OS === "android") {
    ToastAndroid.show("📍 Background location active", ToastAndroid.SHORT);
  }
}
