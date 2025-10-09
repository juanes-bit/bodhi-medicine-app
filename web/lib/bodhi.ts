'use client';

import { normalizeCourse, normalizeProgress } from '@/app/lib/normalizers';
import type { CourseDetail, ProgressRes } from '@/app/types/course';

const WP_BASE = '/api/wp';

const getNonce = () =>
  (typeof window === 'undefined' ? '' : localStorage.getItem('wp_nonce') || '');

async function bodhiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${WP_BASE}/wp-json/bodhi/v1${path}`, {
    credentials: 'include',
    cache: init?.cache ?? 'no-store',
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
  const raw = await bodhiFetch<any>(`/courses/${id}`);
  return normalizeCourse(raw);
}

export async function getProgress(courseId: number): Promise<ProgressRes> {
  const raw = await bodhiFetch<any>(`/progress?course_id=${courseId}`);
  return normalizeProgress(raw, courseId);
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

  const raw = await bodhiFetch<any>('/progress', { method: 'POST', body });
  return normalizeProgress(raw, courseId);
}
