import type React from "react"
import { View, Text } from "react-native"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5", {
  variants: {
    variant: {
      default: "bg-primary-100 text-primary-800",
      secondary: "bg-secondary-100 text-secondary-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
      outline: "border border-border text-foreground",
    },
    size: {
      default: "text-xs",
      sm: "text-xs",
      lg: "text-sm px-3 py-1",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  children: React.ReactNode
  className?: string
}

export function Badge({ children, variant, size, className }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant, size }), className)}>
      <Text className="font-medium">{children}</Text>
    </View>
  )
}
