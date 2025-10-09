'use client';

const BASE = '';
const API = (p: string) => `${BASE}/api/wp/wp-json/bodhi/v1${p}`;

const nonce = () =>
  (typeof window !== 'undefined' ? localStorage.getItem('wp_nonce') || '' : '');

async function get<T>(path: string): Promise<T> {
  const res = await fetch(API(path), {
    credentials: 'include',
    headers: { 'X-WP-Nonce': nonce() },
  });

  if (!res.ok) throw new Error(`GET ${path} ${res.status}`);
  return res.json();
}

async function post<T>(
  path: string,
  body: Record<string, string | number | boolean>,
): Promise<T> {
  const res = await fetch(API(path), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'X-WP-Nonce': nonce(),
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: new URLSearchParams(
      Object.entries(body).map(([key, value]) => [key, String(value)]),
    ),
  });

  if (!res.ok) throw new Error(`POST ${path} ${res.status}`);
  return res.json();
}

export type CourseDetail = {
  id: number;
  title?: string;
  modules: Array<{
    id: number;
    title: string;
    order: number;
    cover_image?: string;
    publish_date?: string;
  }>;
  lessons: Array<{
    id: number;
    moduleId: number;
    title: string;
    type: 'video' | 'article' | 'form';
    url?: string;
    order: number;
    preview_url?: string;
  }>;
};

export const getCourse = (id: number) => get<CourseDetail>(`/courses/${id}`);

export const getProgress = (courseId: number) =>
  get<{
    pct: number;
    total: number;
    done: number;
    progress: Record<string, boolean> | [];
    course_id: number;
  }>(`/progress?course_id=${courseId}`);

export const setProgress = (
  courseId: number,
  lessonId: number,
  done = true,
) =>
  post<{
    pct: number;
    total: number;
    done: number;
    progress: Record<string, boolean>;
    course_id: number;
  }>(`/progress`, { course_id: courseId, lesson_id: lessonId, done });
