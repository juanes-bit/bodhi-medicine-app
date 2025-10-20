import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AppState, StatusBar } from 'react-native';
import {
  useFonts,
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
} from '@expo-google-fonts/montserrat';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
    const subscription = AppState.addEventListener("change", (_) => {
      StatusBar.setBarStyle("dark-content");
    });
    return () => {
      subscription.remove();
    };
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false,animation:'ios_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onBoarding/onBoardingScreen" options={{ gestureEnabled: false }} />
      <Stack.Screen name="auth/signinScreen" options={{ gestureEnabled: false }} />
      <Stack.Screen name="auth/signupScreen" />
      <Stack.Screen name="auth/verificationScreen" />
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      <Stack.Screen name="category/categoriesScreen" />
      <Stack.Screen name="courseDetail/courseDetailScreen" />
      <Stack.Screen name="instructor/instructorScreen" />
      <Stack.Screen name="takeCourse/takeCourseScreen" />
      <Stack.Screen name="watchTrailer/watchTrailerScreen" />
      <Stack.Screen name="notification/notificationScreen" />
      <Stack.Screen name="accountSetting/accountSettingsScreen" />
      <Stack.Screen name="appSetting/appSettingScreen" />
    </Stack>
  );
}
