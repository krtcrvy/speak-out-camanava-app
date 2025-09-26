import { supabase } from "~/utils/supabase";
import { ToastAndroid, Platform, Alert } from "react-native";

function showDebug(message: string) {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert("Debug", message);
  }
}

export async function loadUserSettings(uid: string) {
  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("uid", uid)
    .maybeSingle();

  if (error) {
    showDebug("❌ Failed to load settings");
    return null;
  }

  if (!data) {
    showDebug("⚠️ No user_settings row");
    return null;
  }

  // 🔍 Show raw Supabase response
  showDebug("🗄 Raw row: " + JSON.stringify(data));

  // ✅ Map snake_case → camelCase
  return {
    id: data.id,
    uid: data.uid,
    detectionRadius: data.detection_radius,
    notifySafety: data.notify_safety,
    notifyIncidents: data.notify_incidents,
    hapticFeedback: data.haptic_feedback,
    timeFilter: data.time_filter,
    showReminders: data.show_reminders,
    showPolice: data.show_police,
    showHospital: data.show_hospital,
    showFire: data.show_fire,
    updatedAt: data.updated_at,
    pinTypes: {
      theft: data.pin_theft,
      sexual: data.pin_sexual,
      disorderly: data.pin_disorderly,
    },
  };
}
