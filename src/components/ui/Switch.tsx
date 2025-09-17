"use client"

import { useState } from "react"
import { Pressable, Animated } from "react-native"
import { cn } from "../../lib/utils"

interface SwitchProps {
  value: boolean
  onValueChange: (value: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({ value, onValueChange, disabled = false, className }: SwitchProps) {
  const [animatedValue] = useState(new Animated.Value(value ? 1 : 0))

  const handlePress = () => {
    if (disabled) return

    const newValue = !value
    onValueChange(newValue)

    Animated.timing(animatedValue, {
      toValue: newValue ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  })

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#e5e7eb", "#3b82f6"],
  })

  return (
    <Pressable onPress={handlePress} disabled={disabled} className={cn("", className)}>
      <Animated.View
        style={{ backgroundColor }}
        className={cn("w-12 h-6 rounded-full justify-center relative", disabled && "opacity-50")}
      >
        <Animated.View style={{ transform: [{ translateX }] }} className="w-5 h-5 bg-white rounded-full shadow-sm" />
      </Animated.View>
    </Pressable>
  )
}
