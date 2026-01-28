import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export async function ensureNotificationChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("camanava-alerts", {
      name: "Camanava Alerts",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 500, 200, 500],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}
