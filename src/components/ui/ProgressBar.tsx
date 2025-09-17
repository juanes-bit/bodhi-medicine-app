import { View } from "react-native"
import { cn } from "../../lib/utils"

interface ProgressBarProps {
  progress: number // 0-100
  className?: string
  height?: number
  backgroundColor?: string
  progressColor?: string
}

export function ProgressBar({
  progress,
  className,
  height = 4,
  backgroundColor = "#e5e7eb",
  progressColor = "#3b82f6",
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <View
      className={cn("rounded-full overflow-hidden", className)}
      style={{
        height,
        backgroundColor,
      }}
    >
      <View
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${clampedProgress}%`,
          backgroundColor: progressColor,
        }}
      />
    </View>
  )
}
