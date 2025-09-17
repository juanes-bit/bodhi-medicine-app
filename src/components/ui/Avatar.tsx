import { View, Text } from "react-native"
import { ImageCdn } from "../media/ImageCdn"
import { cn } from "../../lib/utils"

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function Avatar({ src, alt, fallback, size = "md", className }: AvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-xl",
  }

  if (src) {
    return (
      <ImageCdn
        src={src || "/placeholder.svg"}
        alt={alt}
        className={cn("rounded-full", sizeClasses[size], className)}
        cloudinaryOptions={{
          w: size === "sm" ? 32 : size === "md" ? 48 : size === "lg" ? 64 : 96,
          h: size === "sm" ? 32 : size === "md" ? 48 : size === "lg" ? 64 : 96,
          c: "fill",
        }}
      />
    )
  }

  return (
    <View className={cn("bg-primary-100 rounded-full items-center justify-center", sizeClasses[size], className)}>
      <Text className={cn("font-semibold text-primary-600", textSizes[size])}>
        {fallback || alt?.charAt(0)?.toUpperCase() || "?"}
      </Text>
    </View>
  )
}
