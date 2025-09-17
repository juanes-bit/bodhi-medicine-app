"use client"

import React, { useEffect } from "react"
import { Text, Animated } from "react-native"
import { cn } from "../../lib/utils"

interface ToastProps {
  message: string
  type?: "success" | "error" | "info"
  visible: boolean
  onHide: () => void
  duration?: number
}

export function Toast({ message, type = "info", visible, onHide, duration = 3000 }: ToastProps) {
  const opacity = React.useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(duration),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onHide()
      })
    }
  }, [visible, opacity, duration, onHide])

  if (!visible) return null

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }[type]

  return (
    <Animated.View
      style={{ opacity }}
      className={cn("absolute top-16 left-4 right-4 z-50 rounded-2xl px-4 py-3 shadow-lg", bgColor)}
    >
      <Text className="text-white font-medium text-center">{message}</Text>
    </Animated.View>
  )
}
