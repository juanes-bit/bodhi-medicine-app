"use client"

import { useEffect } from "react"
import { Tabs, Redirect } from "expo-router"
import { Home, BookOpen, Crown, Users, User } from "lucide-react-native"
import { useAuthStore } from "../../src/store/auth"
import { t } from "../../src/lib/i18n"

export default function TabLayout() {
  const { isAuthenticated, isLoading, hydrate } = useAuthStore()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (isLoading) {
    // You could show a loading screen here
    return null
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("nav.home"),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="courses/index"
        options={{
          title: t("nav.courses"),
          tabBarIcon: ({ color, size }) => <BookOpen size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="membership/index"
        options={{
          title: t("nav.membership"),
          tabBarIcon: ({ color, size }) => <Crown size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="community/index"
        options={{
          title: t("nav.community"),
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: t("nav.profile"),
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
    </Tabs>
  )
}
