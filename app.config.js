import "dotenv/config";

export default {
  expo: {
    name: "SpeakOut CAMANAVA",
    slug: "speak-out-camanava-app",
    version: "1.0.0",
    scheme: "speak-out-camanava-app",

    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",

    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    assetBundlePatterns: ["**/*"],

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      package: "com.speakout.camanava",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      permissions: [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "VIBRATE",
        "RECEIVE_BOOT_COMPLETED",
        "INTERNET",
        "FOREGROUND_SERVICE",
        "WAKE_LOCK",
        "POST_NOTIFICATIONS",
      ],
    },

    notification: {
      icon: "./assets/logo.png",
      color: "#4CAF50",
      androidMode: "default",
      androidCollapsedTitle: "SpeakOut Alerts",
      androidShowBadge: true,
      // 👇 ensures default notifications go to your custom channel
      androidChannelId: "camanava-alerts",
    },

    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/favicon.png",
    },

    plugins: [
      "expo-router",
      "expo-web-browser",
      [
        "expo-location",
        {
          isAndroidBackgroundLocationEnabled: true,
          locationAlwaysAndWhenInUsePermission:
            "Allow SpeakOut CAMANAVA to access your location even when the app is closed or not in use.",
          locationWhenInUsePermission:
            "Allow SpeakOut CAMANAVA to access your location while using the app.",
        },
      ],
      "expo-notifications",
      "expo-task-manager",
      "./plugins/nonDismissableService",
    ],

    experiments: {
      typedRoutes: true,
      tsconfigPaths: true,
    },

    extra: {
      backendUrl: process.env.EXPO_PUBLIC_BACKEND_API_BASE_URL,
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      eas: {
        projectId: "c844463a-280a-4a05-b6ce-f75c24e0de9f",
      },
    },
  },
};
