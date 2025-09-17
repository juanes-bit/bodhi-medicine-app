import type React from "react"
import { Pressable, Text, ActivityIndicator } from "react-native"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva("flex-row items-center justify-center rounded-2xl px-6 py-4 active:opacity-80", {
  variants: {
    variant: {
      default: "bg-primary-600",
      secondary: "bg-secondary-100 border border-secondary-200",
      outline: "border border-border bg-transparent",
      ghost: "bg-transparent",
      destructive: "bg-red-500",
    },
    size: {
      default: "h-12 px-6",
      sm: "h-10 px-4",
      lg: "h-14 px-8",
      icon: "h-12 w-12",
    },
    disabled: {
      true: "opacity-50",
      false: "",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
    disabled: false,
  },
})

const textVariants = cva("font-semibold text-center", {
  variants: {
    variant: {
      default: "text-white",
      secondary: "text-secondary-700",
      outline: "text-foreground",
      ghost: "text-foreground",
      destructive: "text-white",
    },
    size: {
      default: "text-base",
      sm: "text-sm",
      lg: "text-lg",
      icon: "text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  onPress?: () => void
  loading?: boolean
  disabled?: boolean
  className?: string
  textClassName?: string
}

export function Button({
  children,
  onPress,
  loading = false,
  disabled = false,
  variant,
  size,
  className,
  textClassName,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={cn(buttonVariants({ variant, size, disabled: isDisabled }), className)}
    >
      {loading && <ActivityIndicator size="small" color="white" className="mr-2" />}
      <Text className={cn(textVariants({ variant, size }), textClassName)}>{children}</Text>
    </Pressable>
  )
}
