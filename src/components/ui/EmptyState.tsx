import type React from "react"
import { View } from "react-native"
import { Text } from "./Text"
import { Button } from "./Button"

interface EmptyStateProps {
  title: string
  description?: string
  action?: {
    label: string
    onPress: () => void
  }
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
  return (
    <View className={`flex-1 items-center justify-center px-6 py-12 ${className}`}>
      {icon && <View className="mb-6">{icon}</View>}

      <Text variant="h3" className="text-center mb-2">
        {title}
      </Text>

      {description && (
        <Text variant="body" className="text-center text-muted-foreground mb-8 max-w-sm">
          {description}
        </Text>
      )}

      {action && <Button onPress={action.onPress}>{action.label}</Button>}
    </View>
  )
}
