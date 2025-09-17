import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { BodhiAPI } from "../api/sdk"
import { useAuthStore } from "../store/auth"

export function useLesson(id: number) {
  return useQuery({
    queryKey: ["lesson", id],
    queryFn: () => BodhiAPI.getLesson(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useLessonProgress() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: ({ lessonId, progress }: { lessonId: number; progress: { status: string; positionSec?: number } }) =>
      BodhiAPI.updateLessonProgress(lessonId, progress),
    onSuccess: (_, { lessonId }) => {
      // Invalidate lesson and course queries to update progress
      queryClient.invalidateQueries({ queryKey: ["lesson", lessonId] })
      queryClient.invalidateQueries({ queryKey: ["courses"] })
    },
  })
}

export function useLessonPlayer(lessonId: number) {
  const { data: lesson, isLoading, error } = useLesson(lessonId)
  const progressMutation = useLessonProgress()
  const { user } = useAuthStore()

  const updateProgress = (positionSec: number, durationSec: number) => {
    if (!user || !lesson) return

    const progressPercent = (positionSec / durationSec) * 100
    let status = "in_progress"

    if (progressPercent >= 90) {
      status = "completed"
    } else if (progressPercent < 10) {
      status = "started"
    }

    progressMutation.mutate({
      lessonId,
      progress: { status, positionSec: Math.floor(positionSec) },
    })
  }

  return {
    lesson,
    isLoading,
    error,
    updateProgress,
    isUpdatingProgress: progressMutation.isPending,
  }
}
