/** @type {import('expo/config').ExpoConfig} */
module.exports = ({ config }) => ({
  ...config,
  name: "Bodhi Medicine",
  slug: "bodhi-medicine",
  version: "1.0.0",
  scheme: "bodhi",
  orientation: "portrait",
  assetBundlePatterns: ["**/*"],
  ios: { supportsTablet: true, bundleIdentifier: "com.bodhimedicine.app" },
  android: { package: "com.bodhimedicine.app" },
  web: { bundler: "metro", output: "static" },
  plugins: [
    "expo-router",    
    "expo-secure-store",
    "expo-notifications",
    ["expo-av", { microphonePermission: false }]
  ],
  extra: {
    api: process.env.EXPO_PUBLIC_API || "https://staging.bodhimedicine.com/wp-json",
    cloudinary: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD || "daayxpmsz",
    locale: process.env.EXPO_PUBLIC_LOCALE_DEFAULT || "es",
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN || "",
    eas: { projectId: "your-project-id" },
  },
});
