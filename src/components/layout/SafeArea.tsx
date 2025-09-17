import type React from "react"
import { SafeAreaView } from "react-native-safe-area-context"
import { View } from "react-native"
import { cn } from "../../lib/utils"

interface SafeAreaProps {
  children: React.ReactNode
  className?: string
  edges?: ("top" | "bottom" | "left" | "right")[]
}

export function SafeArea({ children, className, edges = ["top", "bottom"] }: SafeAreaProps) {
  return (
    <SafeAreaView edges={edges} className={cn("flex-1 bg-background", className)}>
      <View className="flex-1">{children}</View>
    </SafeAreaView>
  )
}
