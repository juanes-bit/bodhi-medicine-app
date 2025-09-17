"use client"

import { ScrollView, View } from "react-native"
import { router } from "expo-router"
import { Play, BookOpen, Clock } from "lucide-react-native"
import { SafeArea } from "../../src/components/layout/SafeArea"
import { Text } from "../../src/components/ui/Text"
import { Card } from "../../src/components/ui/Card"
import { Button } from "../../src/components/ui/Button"
import { ImageCdn } from "../../src/components/media/ImageCdn"
import { SkeletonList } from "../../src/components/ui/Skeleton"
import { EmptyState } from "../../src/components/ui/EmptyState"
import { useCourses } from "../../src/hooks/useCourses"
import { useAuthStore } from "../../src/store/auth"
import { useUIStore } from "../../src/store/ui"
import { t } from "../../src/lib/i18n"

export default function HomeScreen() {
  const { user } = useAuthStore()
  const { lastWatchedCourse, lastWatchedLesson } = useUIStore()
  const { data: coursesData, isLoading, error } = useCourses({ page: 1 })

  const continueCourse = () => {
    if (lastWatchedCourse && lastWatchedLesson) {
      router.push(`/courses/${lastWatchedCourse}/lesson/${lastWatchedLesson}`)
    } else if (lastWatchedCourse) {
      router.push(`/courses/${lastWatchedCourse}`)
    }
  }

  const featuredCourses = coursesData?.courses?.slice(0, 3) || []

  return (
    <SafeArea>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text variant="h2" className="text-foreground mb-2">
            Hola, {user?.name || "Estudiante"}
          </Text>
          <Text variant="body" className="text-muted-foreground">
            Continúa tu aprendizaje en medicina natural
          </Text>
        </View>

        {/* Continue Watching */}
        {lastWatchedCourse && (
          <View className="px-6 mb-8">
            <Text variant="h4" className="mb-4">
              {t("courses.continue_watching")}
            </Text>
            <Card pressable onPress={continueCourse} className="bg-primary-50 border-primary-200">
              <View className="flex-row items-center">
                <View className="w-12 h-12 bg-primary-600 rounded-full items-center justify-center mr-4">
                  <Play size={20} color="white" />
                </View>
                <View className="flex-1">
                  <Text variant="body" className="font-semibold text-primary-900 mb-1">
                    Continuar lección
                  </Text>
                  <Text variant="caption" className="text-primary-700">
                    Retoma donde lo dejaste
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Featured Courses */}
        <View className="px-6 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text variant="h4">Cursos destacados</Text>
            <Button variant="ghost" onPress={() => router.push("/(tabs)/courses")}>
              Ver todos
            </Button>
          </View>

          {isLoading ? (
            <SkeletonList count={2} />
          ) : error ? (
            <EmptyState
              title="Error al cargar cursos"
              description="No pudimos cargar los cursos. Intenta de nuevo."
              action={{
                label: "Reintentar",
                onPress: () => window.location.reload(),
              }}
            />
          ) : featuredCourses.length > 0 ? (
            <View className="space-y-4">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </View>
          ) : (
            <EmptyState
              title="No hay cursos disponibles"
              description="Pronto tendremos nuevos cursos para ti."
              icon={<BookOpen size={48} color="#9ca3af" />}
            />
          )}
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-8">
          <Text variant="h4" className="mb-4">
            Acceso rápido
          </Text>
          <View className="flex-row space-x-4">
            <Card pressable onPress={() => router.push("/(tabs)/courses")} className="flex-1">
              <View className="items-center py-4">
                <BookOpen size={32} color="#3b82f6" />
                <Text variant="body" className="mt-2 font-medium">
                  Explorar cursos
                </Text>
              </View>
            </Card>
            <Card pressable onPress={() => router.push("/(tabs)/membership")} className="flex-1">
              <View className="items-center py-4">
                <Clock size={32} color="#a855f7" />
                <Text variant="body" className="mt-2 font-medium">
                  Mi membresía
                </Text>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeArea>
  )
}

function CourseCard({ course }: { course: any }) {
  return (
    <Card pressable onPress={() => router.push(`/courses/${course.id}`)} className="overflow-hidden">
      <View className="flex-row">
        <ImageCdn
          src={course.coverUrl || "/placeholder.svg?height=120&width=120&query=course cover"}
          className="w-24 h-24 rounded-xl"
          cloudinaryOptions={{ w: 120, h: 120, c: "fill" }}
        />
        <View className="flex-1 ml-4">
          <Text variant="body" className="font-semibold mb-2" numberOfLines={2}>
            {course.title}
          </Text>
          <Text variant="caption" className="text-muted-foreground mb-3" numberOfLines={2}>
            {course.excerpt}
          </Text>
          <View className="flex-row items-center justify-between">
            {course.enrolled ? (
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <Text variant="small" className="text-green-600">
                  Inscrito • {course.progress || 0}%
                </Text>
              </View>
            ) : (
              <Text variant="small" className="text-primary-600">
                {course.isFree ? "Gratis" : `$${course.price}`}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Card>
  )
}
