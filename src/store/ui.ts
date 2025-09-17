import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"

interface UIState {
  locale: string
  theme: "light" | "dark" | "system"
  onboardingCompleted: boolean
  lastWatchedCourse: number | null
  lastWatchedLesson: number | null
}

interface UIActions {
  setLocale: (locale: string) => void
  setTheme: (theme: "light" | "dark" | "system") => void
  completeOnboarding: () => void
  setLastWatched: (courseId: number, lessonId: number) => void
  clearLastWatched: () => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      // State
      locale: "es",
      theme: "system",
      onboardingCompleted: false,
      lastWatchedCourse: null,
      lastWatchedLesson: null,

      // Actions
      setLocale: (locale: string) => set({ locale }),
      setTheme: (theme: "light" | "dark" | "system") => set({ theme }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      setLastWatched: (courseId: number, lessonId: number) =>
        set({ lastWatchedCourse: courseId, lastWatchedLesson: lessonId }),
      clearLastWatched: () => set({ lastWatchedCourse: null, lastWatchedLesson: null }),
    }),
    {
      name: "bodhi-ui",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
)
