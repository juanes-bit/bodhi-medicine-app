"use client"

import { useEffect } from "react"
import { View, Animated } from "react-native"
import { cn } from "../../lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  color?: string
  className?: string
}

export function LoadingSpinner({ size = "md", color = "#3b82f6", className }: LoadingSpinnerProps) {
  const spinValue = new Animated.Value(0)

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    )

    spin.start()

    return () => spin.stop()
  }, [spinValue])

  const rotate = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  })

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  }

  const spinnerSize = sizeMap[size]

  return (
    <View className={cn("items-center justify-center", className)}>
      <Animated.View
        style={{
          width: spinnerSize,
          height: spinnerSize,
          borderWidth: 2,
          borderColor: `${color}20`,
          borderTopColor: color,
          borderRadius: spinnerSize / 2,
          transform: [{ rotate }],
        }}
      />
    </View>
  )
}
