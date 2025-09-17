export type Course = {
  id: number
  slug: string
  title: string
  excerpt?: string
  coverUrl?: string
  level?: "beginner" | "intermediate" | "advanced"
  tags?: string[]
  price?: number
  currency?: string
  isFree?: boolean
  enrolled?: boolean
  progress?: number
  modules: Module[]
}

export type Module = {
  id: number
  title: string
  index: number
  lessons: Lesson[]
}

export type Lesson = {
  id: number
  title: string
  index: number
  durationSec?: number
  videoUrl?: string
  downloadable?: boolean
  freePreview?: boolean
  content_html_mobile?: string
}

export type User = {
  id: number
  name: string
  email: string
  avatarUrl?: string
  membership?: "none" | "medicina_con_amor"
  roles?: string[]
}

export type AuthResponse = {
  token: string
  user: User
}

export type CoursesResponse = {
  courses: Course[]
  total: number
  page: number
  totalPages: number
}

export type CheckoutResponse = {
  url: string
}

export type ApiError = {
  message: string
  code?: string
  status?: number
}
