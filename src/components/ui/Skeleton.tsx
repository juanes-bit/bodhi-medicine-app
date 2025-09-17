"use client"
import { View, Animated, useEffect } from "react-native"
import { cn } from "../../lib/utils"

interface SkeletonProps {
  className?: string
  width?: number | string
  height?: number | string
}

export function Skeleton({ className, width, height }: SkeletonProps) {
  const opacity = new Animated.Value(0.3)

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    )

    animation.start()

    return () => animation.stop()
  }, [opacity])

  return (
    <Animated.View
      style={{
        opacity,
        width,
        height,
      }}
      className={cn("bg-muted rounded-2xl", className)}
    />
  )
}

export function SkeletonCard() {
  return (
    <View className="p-4 space-y-3">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </View>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  )
}
