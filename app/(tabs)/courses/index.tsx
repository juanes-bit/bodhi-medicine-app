"use client"

import { useState } from "react"
import { ScrollView, View, FlatList, RefreshControl } from "react-native"
import { router } from "expo-router"
import { BookOpen } from "lucide-react-native"
import { SafeArea } from "../../../src/components/layout/SafeArea"
import { Text } from "../../../src/components/ui/Text"
import { Input } from "../../../src/components/ui/Input"
import { Card } from "../../../src/components/ui/Card"
import { Badge } from "../../../src/components/ui/Badge"
import { Chip } from "../../../src/components/ui/Chip"
import { Button } from "../../../src/components/ui/Button"
import { ImageCdn } from "../../../src/components/media/ImageCdn"
import { SkeletonList } from "../../../src/components/ui/Skeleton"
import { EmptyState } from "../../../src/components/ui/EmptyState"
import { useCourses } from "../../../src/hooks/useCourses"
import { t } from "../../../src/lib/i18n"

const COURSE_TAGS = ["medicina", "natural", "nutrición", "herbolaria", "terapias", "bienestar"]

export default function CoursesScreen() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const {
    data: coursesData,
    isLoading,
    error,
    refetch,
  } = useCourses({
    search: searchQuery,
    tag: selectedTag || undefined,
    page: 1,
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedTag(null)
  }

  const courses = coursesData?.courses || []

  return (
    <SafeArea>
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 pt-4 pb-2">
          <Text variant="h2" className="mb-4">
            {t("nav.courses")}
          </Text>

          {/* Search */}
          <Input placeholder="Buscar cursos..." value={searchQuery} onChangeText={setSearchQuery} className="mb-4" />

          {/* Tags Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row space-x-2 px-1">
              {COURSE_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  selected={selectedTag === tag}
                  onPress={() => setSelectedTag(selectedTag === tag ? null : tag)}
                >
                  {tag}
                </Chip>
              ))}
            </View>
          </ScrollView>

          {/* Active Filters */}
          {(searchQuery || selectedTag) && (
            <View className="flex-row items-center justify-between mb-4">
              <Text variant="caption">
                {courses.length} resultado{courses.length !== 1 ? "s" : ""}
              </Text>
              <Button variant="ghost" onPress={clearFilters}>
                Limpiar filtros
              </Button>
            </View>
          )}
        </View>

        {/* Course List */}
        {isLoading ? (
          <ScrollView className="flex-1 px-6">
            <SkeletonList count={4} />
          </ScrollView>
        ) : error ? (
          <EmptyState
            title="Error al cargar cursos"
            description="No pudimos cargar los cursos. Intenta de nuevo."
            action={{
              label: "Reintentar",
              onPress: () => refetch(),
            }}
          />
        ) : courses.length > 0 ? (
          <FlatList
            data={courses}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <CourseListItem course={item} />}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ItemSeparatorComponent={() => <View className="h-4" />}
          />
        ) : (
          <EmptyState
            title="No se encontraron cursos"
            description={
              searchQuery || selectedTag
                ? "Intenta con otros términos de búsqueda o filtros."
                : "Pronto tendremos nuevos cursos para ti."
            }
            icon={<BookOpen size={48} color="#9ca3af" />}
            action={
              searchQuery || selectedTag
                ? {
                    label: "Limpiar filtros",
                    onPress: clearFilters,
                  }
                : undefined
            }
          />
        )}
      </View>
    </SafeArea>
  )
}

function CourseListItem({ course }: { course: any }) {
  return (
    <Card pressable onPress={() => router.push(`/courses/${course.id}`)} className="overflow-hidden">
      <View>
        {/* Course Image */}
        <ImageCdn
          src={course.coverUrl || "/placeholder.svg?height=200&width=400&query=course cover"}
          className="w-full h-48 rounded-xl mb-4"
          cloudinaryOptions={{ w: 400, h: 200, c: "fill" }}
        />

        {/* Course Info */}
        <View className="space-y-3">
          <View className="flex-row items-start justify-between">
            <Text variant="h4" className="flex-1 mr-2" numberOfLines={2}>
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

          <Text variant="body" className="text-muted-foreground" numberOfLines={3}>
            {course.excerpt}
          </Text>

          {/* Tags */}
          {course.tags && course.tags.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-2">
                {course.tags.slice(0, 3).map((tag: string, index: number) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Status and Price */}
          <View className="flex-row items-center justify-between pt-2">
            {course.enrolled ? (
              <View className="flex-row items-center">
                <View className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                <Text variant="body" className="text-green-600 font-medium">
                  Inscrito • {course.progress || 0}% completado
                </Text>
              </View>
            ) : (
              <Text variant="body" className="font-semibold text-primary-600">
                {course.isFree ? "Gratis" : `$${course.price} ${course.currency || "USD"}`}
              </Text>
            )}

            <Text variant="caption" className="text-muted-foreground">
              {course.modules?.length || 0} módulos
            </Text>
          </View>
        </View>
      </View>
    </Card>
  )
}
