"use client"

import { useState, useEffect } from "react"
import { ScrollView, View, Pressable, Dimensions } from "react-native"
import { router, useLocalSearchParams } from "expo-router"
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Share, BookOpen } from "lucide-react-native"
import RenderHTML from "react-native-render-html"
import { SafeArea } from "../../../../src/components/layout/SafeArea"
import { Text } from "../../../../src/components/ui/Text"
import { Button } from "../../../../src/components/ui/Button"
import { Card } from "../../../../src/components/ui/Card"
import { VideoPlayer } from "../../../../src/components/media/VideoPlayer"
import { SkeletonList } from "../../../../src/components/ui/Skeleton"
import { EmptyState } from "../../../../src/components/ui/EmptyState"
import { useLessonPlayer } from "../../../../src/hooks/useLessonPlayer"
import { useCourse } from "../../../../src/hooks/useCourses"
import { useAuthStore } from "../../../../src/store/auth"
import { useUIStore } from "../../../../src/store/ui"
import { formatDuration } from "../../../../src/lib/utils"

const HTML_WHITELIST = {
  p: true,
  h1: true,
  h2: true,
  h3: true,
  h4: true,
  strong: true,
  em: true,
  ul: true,
  ol: true,
  li: true,
  blockquote: true,
  img: true,
  a: true,
  br: true,
}

export default function LessonPlayerScreen() {
  const { id, lid } = useLocalSearchParams<{ id: string; lid: string }>()
  const courseId = Number.parseInt(id || "0")
  const lessonId = Number.parseInt(lid || "0")

  const { width } = Dimensions.get("window")
  const { user } = useAuthStore()
  const { setLastWatched } = useUIStore()

  const { lesson, isLoading, error, updateProgress } = useLessonPlayer(lessonId)
  const { data: course } = useCourse(courseId)

  const [showTranscript, setShowTranscript] = useState(false)

  // Find current lesson position and navigation
  const allLessons = course?.modules.flatMap((module) => module.lessons) || []
  const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Update last watched when lesson loads
  useEffect(() => {
    if (lesson && user) {
      setLastWatched(courseId, lessonId)
    }
  }, [lesson, user, courseId, lessonId, setLastWatched])

  const handleVideoProgress = (position: number, duration: number) => {
    updateProgress(position, duration)
  }

  const navigateToLesson = (targetLessonId: number) => {
    router.replace(`/courses/${courseId}/lesson/${targetLessonId}`)
  }

  const handleDownload = () => {
    // TODO: Implement download functionality
    console.log("Download lesson:", lessonId)
  }

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log("Share lesson:", lessonId)
  }

  if (isLoading) {
    return (
      <SafeArea>
        <View className="px-6 py-4">
          <SkeletonList count={2} />
        </View>
      </SafeArea>
    )
  }

  if (error || !lesson) {
    return (
      <SafeArea>
        <EmptyState
          title="Error al cargar la lección"
          description="No pudimos cargar el contenido de la lección."
          action={{
            label: "Volver al curso",
            onPress: () => router.back(),
          }}
        />
      </SafeArea>
    )
  }

  return (
    <SafeArea edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
          <Pressable onPress={() => router.back()} className="flex-row items-center">
            <ArrowLeft size={20} color="#374151" />
            <Text variant="body" className="ml-2 font-medium">
              Volver al curso
            </Text>
          </Pressable>

          <View className="flex-row items-center space-x-2">
            {lesson.downloadable && (
              <Pressable onPress={handleDownload} className="p-2">
                <Download size={20} color="#6b7280" />
              </Pressable>
            )}
            <Pressable onPress={handleShare} className="p-2">
              <Share size={20} color="#6b7280" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Video Player */}
          {lesson.videoUrl && (
            <View className="px-6 py-4">
              <VideoPlayer
                uri={lesson.videoUrl}
                lessonId={lessonId}
                userId={user?.id || 0}
                onProgress={handleVideoProgress}
                className="mb-4"
              />
            </View>
          )}

          {/* Lesson Info */}
          <View className="px-6 py-4">
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-1 mr-4">
                <Text variant="h3" className="mb-2">
                  {lesson.title}
                </Text>
                <View className="flex-row items-center space-x-4">
                  <Text variant="caption" className="text-muted-foreground">
                    Lección {lesson.index + 1}
                  </Text>
                  {lesson.durationSec && (
                    <Text variant="caption" className="text-muted-foreground">
                      {formatDuration(lesson.durationSec)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Lesson Content */}
            {lesson.content_html_mobile && (
              <Card className="mb-6">
                <View className="p-4">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text variant="body" className="font-semibold">
                      Contenido de la lección
                    </Text>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => setShowTranscript(!showTranscript)}
                      className="flex-row items-center"
                    >
                      <BookOpen size={16} color="#6b7280" />
                      <Text className="ml-1 text-sm">{showTranscript ? "Ocultar" : "Mostrar"} transcripción</Text>
                    </Button>
                  </View>

                  {showTranscript && (
                    <View className="border-t border-border pt-4">
                      <RenderHTML
                        contentWidth={width - 80} // Account for padding
                        source={{ html: lesson.content_html_mobile }}
                        tagsStyles={{
                          p: {
                            marginBottom: 16,
                            lineHeight: 24,
                            fontSize: 16,
                            color: "#374151",
                          },
                          h1: {
                            fontSize: 24,
                            fontWeight: "bold",
                            marginBottom: 16,
                            color: "#111827",
                          },
                          h2: {
                            fontSize: 20,
                            fontWeight: "bold",
                            marginBottom: 12,
                            color: "#111827",
                          },
                          h3: {
                            fontSize: 18,
                            fontWeight: "600",
                            marginBottom: 12,
                            color: "#111827",
                          },
                          h4: {
                            fontSize: 16,
                            fontWeight: "600",
                            marginBottom: 8,
                            color: "#111827",
                          },
                          strong: {
                            fontWeight: "bold",
                          },
                          em: {
                            fontStyle: "italic",
                          },
                          ul: {
                            marginBottom: 16,
                          },
                          ol: {
                            marginBottom: 16,
                          },
                          li: {
                            marginBottom: 8,
                            fontSize: 16,
                            lineHeight: 24,
                          },
                          blockquote: {
                            borderLeftWidth: 4,
                            borderLeftColor: "#3b82f6",
                            paddingLeft: 16,
                            marginBottom: 16,
                            fontStyle: "italic",
                            backgroundColor: "#f8fafc",
                            padding: 16,
                            borderRadius: 8,
                          },
                          img: {
                            marginBottom: 16,
                            borderRadius: 8,
                          },
                          a: {
                            color: "#3b82f6",
                            textDecorationLine: "underline",
                          },
                        }}
                        enableExperimentalMarginCollapsing
                        renderersProps={{
                          img: {
                            enableExperimentalPercentWidth: true,
                          },
                        }}
                      />
                    </View>
                  )}
                </View>
              </Card>
            )}

            {/* Navigation */}
            <View className="flex-row items-center justify-between">
              {prevLesson ? (
                <Button
                  variant="outline"
                  onPress={() => navigateToLesson(prevLesson.id)}
                  className="flex-row items-center flex-1 mr-2"
                >
                  <ChevronLeft size={16} color="#6b7280" />
                  <View className="flex-1 ml-2">
                    <Text variant="small" className="text-muted-foreground">
                      Anterior
                    </Text>
                    <Text variant="caption" numberOfLines={1}>
                      {prevLesson.title}
                    </Text>
                  </View>
                </Button>
              ) : (
                <View className="flex-1 mr-2" />
              )}

              {nextLesson ? (
                <Button onPress={() => navigateToLesson(nextLesson.id)} className="flex-row items-center flex-1 ml-2">
                  <View className="flex-1 mr-2">
                    <Text variant="small" className="text-white text-right">
                      Siguiente
                    </Text>
                    <Text variant="caption" className="text-white/80 text-right" numberOfLines={1}>
                      {nextLesson.title}
                    </Text>
                  </View>
                  <ChevronRight size={16} color="white" />
                </Button>
              ) : (
                <Button variant="secondary" onPress={() => router.push(`/courses/${courseId}`)} className="flex-1 ml-2">
                  Finalizar curso
                </Button>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeArea>
  )
}
