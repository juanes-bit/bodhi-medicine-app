import { View } from "react-native"
import { BookOpen, Clock, Award, TrendingUp } from "lucide-react-native"
import { Text } from "../ui/Text"
import { Card } from "../ui/Card"
import { ProgressBar } from "../ui/ProgressBar"

interface LearningStatsProps {
  stats: {
    coursesEnrolled: number
    coursesCompleted: number
    totalWatchTime: number // in minutes
    currentStreak: number // days
    completionRate: number // percentage
  }
}

export function LearningStats({ stats }: LearningStatsProps) {
  const formatWatchTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours === 0) {
      return `${remainingMinutes}m`
    }
    return `${hours}h ${remainingMinutes}m`
  }

  return (
    <Card>
      <View className="space-y-4">
        <Text variant="h4" className="mb-2">
          Tu progreso de aprendizaje
        </Text>

        {/* Stats Grid */}
        <View className="flex-row flex-wrap -mx-2">
          <View className="w-1/2 px-2 mb-4">
            <View className="bg-primary-50 rounded-xl p-4 items-center">
              <BookOpen size={24} color="#3b82f6" />
              <Text variant="h3" className="text-primary-600 mt-2">
                {stats.coursesEnrolled}
              </Text>
              <Text variant="caption" className="text-primary-700 text-center">
                Cursos inscritos
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-4">
            <View className="bg-green-50 rounded-xl p-4 items-center">
              <Award size={24} color="#10b981" />
              <Text variant="h3" className="text-green-600 mt-2">
                {stats.coursesCompleted}
              </Text>
              <Text variant="caption" className="text-green-700 text-center">
                Cursos completados
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-4">
            <View className="bg-purple-50 rounded-xl p-4 items-center">
              <Clock size={24} color="#8b5cf6" />
              <Text variant="h3" className="text-purple-600 mt-2">
                {formatWatchTime(stats.totalWatchTime)}
              </Text>
              <Text variant="caption" className="text-purple-700 text-center">
                Tiempo total
              </Text>
            </View>
          </View>

          <View className="w-1/2 px-2 mb-4">
            <View className="bg-orange-50 rounded-xl p-4 items-center">
              <TrendingUp size={24} color="#f97316" />
              <Text variant="h3" className="text-orange-600 mt-2">
                {stats.currentStreak}
              </Text>
              <Text variant="caption" className="text-orange-700 text-center">
                Días seguidos
              </Text>
            </View>
          </View>
        </View>

        {/* Completion Rate */}
        <View className="space-y-2">
          <View className="flex-row items-center justify-between">
            <Text variant="body" className="font-medium">
              Tasa de finalización
            </Text>
            <Text variant="body" className="text-primary-600">
              {stats.completionRate}%
            </Text>
          </View>
          <ProgressBar progress={stats.completionRate} />
        </View>
      </View>
    </Card>
  )
}
