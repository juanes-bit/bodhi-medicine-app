'use client';

export type CourseLesson = {
  id: number;
  moduleId?: number;
  title: string;
  type?: 'video' | 'form' | 'article';
  url?: string;
  order?: number;
  preview_url?: string;
};

export type CourseModule = {
  id: number;
  title: string;
  order?: number;
  cover_image?: string;
  publish_date?: string;
  schema?: any[];
  lessons?: { id: number; title: string }[];
};

export type CourseDetail = {
  id: number;
  title?: string;
  modules?: CourseModule[];
  lessons?: CourseLesson[];
};

export type ProgressRes = {
  pct: number;
  total: number;
  done: number;
  progress: Record<string, boolean>;
  course_id: number;
};

const WP_BASE = '/api/wp';

const getNonce = () =>
  (typeof window === 'undefined' ? '' : localStorage.getItem('wp_nonce') || '');

async function bodhiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${WP_BASE}/wp-json/bodhi/v1${path}`, {
    credentials: 'include',
    headers: {
      'X-WP-Nonce': getNonce(),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(`Bodhi ${path} ${res.status}: ${msg}`);
  }

  return res.json();
}

export async function getMe(): Promise<{
  logged_in: boolean;
  id?: number;
  name?: string;
}> {
  return bodhiFetch('/me');
}

export async function getCourses(): Promise<{
  items: { id: number; title: string; slug?: string }[];
}> {
  return bodhiFetch('/courses');
}

export async function getCourse(id: number): Promise<CourseDetail> {
  return bodhiFetch(`/courses/${id}`);
}

export async function getProgress(courseId: number): Promise<ProgressRes> {
  return bodhiFetch(`/progress?course_id=${courseId}`);
}

export async function setProgress(
  courseId: number,
  lessonId: number,
  done = true,
): Promise<ProgressRes> {
  const body = new URLSearchParams();
  body.set('course_id', String(courseId));
  body.set('lesson_id', String(lessonId));
  if (done) body.set('done', '1');

  return bodhiFetch('/progress', { method: 'POST', body });
}
