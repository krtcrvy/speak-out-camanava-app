import "dotenv/config";

export default {
  expo: {
    name: "SpeakOut CAMANAVA",
    slug: "speak-out-camanava-app",
    version: "1.0.0",
    scheme: "speak-out-camanava-app",
    projectId: "c844463a-280a-4a05-b6ce-f75c24e0de9f",
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
      googleServicesFile: "./android/app/google-services.json",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "your_google_maps_api_key_here",
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
      // Add this for better Firebase integration
      useNextNotificationsApi: true,
    },

    notification: {
      icon: "./assets/logo.png",
      color: "#4CAF50",
      androidMode: "default",
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
      [
        "expo-notifications",
        {
          icon: "./assets/logo.png",
          color: "#4CAF50",
          // Optional: Add default sound
          // sound: "./assets/notification.wav",
        }
      ],
      "expo-task-manager",
      "./plugins/nonDismissableService",
      
      // Add these plugins for better Firebase support
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            buildToolsVersion: "34.0.0",
            // Add Firebase/GMS dependencies
            extraMavenRepos: [
              "https://maven.google.com/",
            ],
          },
        },
      ],
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
    
    // Add this for better Android configuration
    androidNavigationBar: {
      backgroundColor: "#ffffff",
    },
    
    // iOS configuration (even if you're not using iOS, it's good to have)
    ios: {
      bundleIdentifier: "com.speakout.camanava",
      supportsTablet: true,
    },
  },
};