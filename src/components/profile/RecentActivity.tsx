import { View, FlatList } from "react-native"
import { Play, BookOpen, Award } from "lucide-react-native"
import { Text } from "../ui/Text"
import { Card } from "../ui/Card"
import { formatDate } from "../../lib/utils"

interface ActivityItem {
  id: string
  type: "lesson_completed" | "course_enrolled" | "course_completed"
  title: string
  subtitle?: string
  date: Date
}

interface RecentActivityProps {
  activities: ActivityItem[]
  onViewAll?: () => void
}

export function RecentActivity({ activities, onViewAll }: RecentActivityProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case "lesson_completed":
        return <Play size={16} color="#3b82f6" />
      case "course_enrolled":
        return <BookOpen size={16} color="#10b981" />
      case "course_completed":
        return <Award size={16} color="#f59e0b" />
      default:
        return <BookOpen size={16} color="#6b7280" />
    }
  }

  const getActivityText = (type: string) => {
    switch (type) {
      case "lesson_completed":
        return "Lección completada"
      case "course_enrolled":
        return "Inscrito en curso"
      case "course_completed":
        return "Curso completado"
      default:
        return "Actividad"
    }
  }

  const renderActivity = ({ item }: { item: ActivityItem }) => (
    <View className="flex-row items-start py-3 border-b border-border last:border-b-0">
      <View className="w-8 h-8 bg-muted rounded-full items-center justify-center mr-3 mt-1">
        {getActivityIcon(item.type)}
      </View>
      <View className="flex-1">
        <Text variant="body" className="font-medium mb-1">
          {item.title}
        </Text>
        <Text variant="caption" className="text-muted-foreground mb-1">
          {getActivityText(item.type)}
        </Text>
        <Text variant="small" className="text-muted-foreground">
          {formatDate(item.date)}
        </Text>
      </View>
    </View>
  )

  if (activities.length === 0) {
    return (
      <Card>
        <View className="items-center py-8">
          <BookOpen size={32} color="#9ca3af" />
          <Text variant="body" className="font-semibold mt-3 mb-2">
            Sin actividad reciente
          </Text>
          <Text variant="caption" className="text-muted-foreground text-center">
            Comienza un curso para ver tu actividad aquí
          </Text>
        </View>
      </Card>
    )
  }

  return (
    <Card>
      <View className="space-y-4">
        <View className="flex-row items-center justify-between">
          <Text variant="h4">Actividad reciente</Text>
          {onViewAll && (
            <Text variant="caption" className="text-primary-600" onPress={onViewAll}>
              Ver todo
            </Text>
          )}
        </View>

        <FlatList
          data={activities.slice(0, 5)}
          renderItem={renderActivity}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Card>
  )
}
