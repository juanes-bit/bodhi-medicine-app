"use client"

import { useEffect } from "react"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as Linking from "expo-linking"
import { handleDeepLink } from "../src/lib/deeplinks"
import "../global.css"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
})

export default function RootLayout() {
  useEffect(() => {
    // Handle deep links
    const subscription = Linking.addEventListener("url", ({ url }) => {
      handleDeepLink(url)
    })

    // Handle initial URL if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url)
      }
    })

    return () => subscription?.remove()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="courses" />
        <Stack.Screen name="paywall" />
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  )
}
