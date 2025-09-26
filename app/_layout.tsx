import "../global.css";
import { Slot, Stack, useRouter } from "expo-router";
import { PhotoProvider } from "~/components/layouts/auth/photo-context";
import { SignUpProvider } from "~/components/layouts/auth/signup-context";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { useEffect, useRef } from "react";

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
} from "@expo-google-fonts/inter";

import * as Notifications from "expo-notifications";
import { Vibration, Platform } from "react-native";
import { registerForPushNotificationsAsync } from "~/utils/registerPush";
import { startBackgroundLocation } from "~/tasks/locationTask"; // ✅ import your function

// ✅ Notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ✅ Ask Android 13+ for POST_NOTIFICATIONS
async function requestNotificationPermission() {
  if (Platform.OS === "android") {
    const settings = await Notifications.getPermissionsAsync();

    if (!settings.granted) {
      const request = await Notifications.requestPermissionsAsync();
      console.log("Notification permission:", request);
    }
  }
}

export default function Layout() {
  const router = useRouter();

  const [loaded, error] = useFonts({
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

  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    // ✅ Ask for POST_NOTIFICATIONS on Android 13+
    requestNotificationPermission();

    // ✅ Register push notifications (Expo token)
    registerForPushNotificationsAsync();

    // ✅ Start background location service with persistent notif
    startBackgroundLocation();

    // Foreground notifications
    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        Vibration.vibrate([500, 200, 500]); // strong vibration
      });

    // When user taps a notification
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        Vibration.vibrate([500, 200, 500]);

        const data = response.notification.request.content.data as {
          incidentId?: string;
          safetyId?: string;
          latitude?: string;
          longitude?: string;
        };

        if (data?.incidentId || data?.safetyId) {
          router.push({
            pathname: "/(auth)/sign-up/pin-user",
            params: {
              ...(data.incidentId ? { incidentId: data.incidentId } : {}),
              ...(data.safetyId ? { safetyId: data.safetyId } : {}),
              ...(data.latitude ? { latitude: data.latitude } : {}),
              ...(data.longitude ? { longitude: data.longitude } : {}),
            },
          });
        }
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SignUpProvider>
      <PhotoProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Slot />
        </Stack>
      </PhotoProvider>
    </SignUpProvider>
  );
}
