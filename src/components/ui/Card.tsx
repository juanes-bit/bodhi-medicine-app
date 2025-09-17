import type React from "react"
import { View, Pressable } from "react-native"
import { cn } from "../../lib/utils"

interface CardProps {
  children: React.ReactNode
  className?: string
  onPress?: () => void
  pressable?: boolean
}

export function Card({ children, className, onPress, pressable = false }: CardProps) {
  if (pressable || onPress) {
    return (
      <Pressable
        onPress={onPress}
        className={cn("rounded-2xl bg-card border border-border p-4 shadow-sm active:opacity-95", className)}
      >
        {children}
      </Pressable>
    )
  }

  return <View className={cn("rounded-2xl bg-card border border-border p-4 shadow-sm", className)}>{children}</View>
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn("mb-4", className)}>{children}</View>
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn("", className)}>{children}</View>
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <View className={cn("mt-4 flex-row justify-end", className)}>{children}</View>
}
