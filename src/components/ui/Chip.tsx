import type React from "react"
import { Pressable, Text } from "react-native"
import { cn } from "../../lib/utils"

interface ChipProps {
  children: React.ReactNode
  selected?: boolean
  onPress?: () => void
  className?: string
  disabled?: boolean
}

export function Chip({ children, selected = false, onPress, className, disabled = false }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        "inline-flex items-center rounded-full px-4 py-2 border active:opacity-80",
        selected ? "bg-primary-600 border-primary-600" : "bg-transparent border-border hover:bg-muted",
        disabled && "opacity-50",
        className,
      )}
    >
      <Text className={cn("text-sm font-medium", selected ? "text-white" : "text-foreground")}>{children}</Text>
    </Pressable>
  )
}
