"use client"

import { ScrollView, View, Pressable } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { Play, Lock, Clock, BookOpen, Users, ArrowLeft } from "lucide-react-native"
import { SafeArea } from "../../../src/components/layout/SafeArea"
import { Text } from "../../../src/components/ui/Text"
import { Button } from "../../../src/components/ui/Button"
import { Card } from "../../../src/components/ui/Card"
import { Badge } from "../../../src/components/ui/Badge"
import { ImageCdn } from "../../../src/components/media/ImageCdn"
import { SkeletonList } from "../../../src/components/ui/Skeleton"
import { EmptyState } from "../../../src/components/ui/EmptyState"
import { useCourse, useEnrollCourse } from "../../../src/hooks/useCourses"
import { useAuthStore } from "../../../src/store/auth"
import { t } from "../../../src/lib/i18n"
import { formatDuration } from "../../../src/lib/utils"

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const courseId = Number.parseInt(id || "0")

  const { user } = useAuthStore()
  const { data: course, isLoading, error } = useCourse(courseId)
  const { enrollCourse } = useEnrollCourse()

  const handleEnroll = async () => {
    try {
      if (course?.isFree) {
        await enrollCourse(courseId)
      } else {
        // Navigate to checkout
        router.push("/paywall/checkout")
      }
    } catch (error) {
      console.error("Enrollment error:", error)
    }
  }

  const handleLessonPress = (lessonId: number) => {
    router.push(`/courses/${courseId}/lesson/${lessonId}`)
  }

  if (isLoading) {
    return (
      <SafeArea>
        <ScrollView className="flex-1 px-6">
          <SkeletonList count={3} />
        </ScrollView>
      </SafeArea>
    )
  }

  if (error || !course) {
    return (
      <SafeArea>
        <EmptyState
          title="Error al cargar el curso"
          description="No pudimos cargar la información del curso."
          action={{
            label: "Volver",
            onPress: () => router.back(),
          }}
        />
      </SafeArea>
    )
  }

  const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0)
  const totalDuration = course.modules.reduce(
    (acc, module) => acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + (lesson.durationSec || 0), 0),
    0,
  )

  return (
    <SafeArea>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="relative">
          <ImageCdn
            src={course.coverUrl || "/placeholder.svg?height=300&width=400&query=course hero"}
            className="w-full h-64"
            cloudinaryOptions={{ w: 400, h: 300, c: "fill" }}
          />
          <View className="absolute inset-0 bg-black/30" />

          {/* Back Button */}
          <Pressable
            onPress={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
          >
            <ArrowLeft size={20} color="white" />
          </Pressable>

          {/* Course Title Overlay */}
          <View className="absolute bottom-0 left-0 right-0 p-6">
            <Text variant="h2" className="text-white mb-2">
              {course.title}
            </Text>
            {course.level && (
              <Badge
                variant={
                  course.level === "beginner" ? "success" : course.level === "intermediate" ? "warning" : "error"
                }
              >
                {course.level === "beginner"
                  ? "Principiante"
                  : course.level === "intermediate"
                    ? "Intermedio"
                    : "Avanzado"}
              </Badge>
            )}
          </View>
        </View>

        <View className="px-6 py-6">
          {/* Course Stats */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center space-x-4">
              <View className="flex-row items-center">
                <BookOpen size={16} color="#6b7280" />
                <Text variant="caption" className="ml-1">
                  {totalLessons} lecciones
                </Text>
              </View>
              <View className="flex-row items-center">
                <Clock size={16} color="#6b7280" />
                <Text variant="caption" className="ml-1">
                  {formatDuration(totalDuration)}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Users size={16} color="#6b7280" />
                <Text variant="caption" className="ml-1">
                  1.2k estudiantes
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <Text variant="body" className="text-muted-foreground mb-6 leading-relaxed">
            {course.excerpt}
          </Text>

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mb-6">
              {course.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </View>
          )}

          {/* Enrollment Status / CTA */}
          {course.enrolled ? (
            <View className="mb-6">
              <Card className="bg-green-50 border-green-200">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="w-3 h-3 bg-green-500 rounded-full mr-3" />
                    <View>
                      <Text variant="body" className="font-semibold text-green-800">
                        Ya estás inscrito
                      </Text>
                      <Text variant="caption" className="text-green-600">
                        Progreso: {course.progress || 0}%
                      </Text>
                    </View>
                  </View>
                  <Button
                    variant="secondary"
                    onPress={() => {
                      // Navigate to first incomplete lesson or first lesson
                      const firstLesson = course.modules[0]?.lessons[0]
                      if (firstLesson) {
                        handleLessonPress(firstLesson.id)
                      }
                    }}
                  >
                    {t("courses.continue")}
                  </Button>
                </View>
              </Card>
            </View>
          ) : (
            <View className="mb-6">
              <Card className="bg-primary-50 border-primary-200">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text variant="body" className="font-semibold text-primary-900 mb-1">
                      {course.isFree ? "Curso gratuito" : `$${course.price} ${course.currency || "USD"}`}
                    </Text>
                    <Text variant="caption" className="text-primary-700">
                      Acceso completo al curso
                    </Text>
                  </View>
                  <Button onPress={handleEnroll}>{course.isFree ? t("courses.enroll") : "Comprar curso"}</Button>
                </View>
              </Card>
            </View>
          )}

          {/* Course Content */}
          <Text variant="h4" className="mb-4">
            Contenido del curso
          </Text>

          <View className="space-y-4">
            {course.modules.map((module, moduleIndex) => (
              <Card key={module.id} className="overflow-hidden">
                <View className="p-4 bg-muted/50 border-b border-border">
                  <Text variant="body" className="font-semibold">
                    Módulo {moduleIndex + 1}: {module.title}
                  </Text>
                  <Text variant="caption" className="text-muted-foreground">
                    {module.lessons.length} lecciones
                  </Text>
                </View>

                <View className="divide-y divide-border">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <Pressable
                      key={lesson.id}
                      onPress={() => {
                        if (course.enrolled || lesson.freePreview) {
                          handleLessonPress(lesson.id)
                        }
                      }}
                      disabled={!course.enrolled && !lesson.freePreview}
                      className="p-4 flex-row items-center justify-between active:bg-muted/50"
                    >
                      <View className="flex-row items-center flex-1">
                        <View className="w-8 h-8 rounded-full bg-muted items-center justify-center mr-3">
                          {course.enrolled || lesson.freePreview ? (
                            <Play size={14} color="#3b82f6" />
                          ) : (
                            <Lock size={14} color="#9ca3af" />
                          )}
                        </View>

                        <View className="flex-1">
                          <Text
                            variant="body"
                            className={`font-medium ${!course.enrolled && !lesson.freePreview ? "text-muted-foreground" : ""}`}
                            numberOfLines={1}
                          >
                            {lessonIndex + 1}. {lesson.title}
                          </Text>
                          <View className="flex-row items-center space-x-2 mt-1">
                            {lesson.durationSec && (
                              <Text variant="small" className="text-muted-foreground">
                                {formatDuration(lesson.durationSec)}
                              </Text>
                            )}
                            {lesson.freePreview && (
                              <Badge variant="success" size="sm">
                                Vista previa
                              </Badge>
                            )}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </Card>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeArea>
  )
}
