import { useQuery, useQueryClient } from "@tanstack/react-query"
import { BodhiAPI } from "../api/sdk"

interface UseCoursesParams {
  lang?: string
  search?: string
  tag?: string
  page?: number
}

export function useCourses(params: UseCoursesParams = {}) {
  return useQuery({
    queryKey: ["courses", params],
    queryFn: () => BodhiAPI.getCourses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCourse(id: number) {
  return useQuery({
    queryKey: ["course", id],
    queryFn: () => BodhiAPI.getCourse(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCourseLessons(courseId: number) {
  return useQuery({
    queryKey: ["lessons", courseId],
    queryFn: () => BodhiAPI.getCourseLessons(courseId),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useEnrollCourse() {
  const queryClient = useQueryClient()

  return {
    enrollCourse: async (courseId: number) => {
      await BodhiAPI.enrollCourse(courseId)

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ["courses"] })
      queryClient.invalidateQueries({ queryKey: ["course", courseId] })
      queryClient.invalidateQueries({ queryKey: ["me"] })
    },
  }
}
