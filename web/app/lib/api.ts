import { absoluteUrl, authHeaders, parseJsonStrict } from '@/app/lib/http';
import { normalizeCourse, normalizeProgress } from '@/app/lib/normalizers';
import type { CourseDetail, ProgressRes, Me } from '@/app/types/course';
import type { Lesson } from '@/app/types/lesson';

export type FetchOpts = { cache?: RequestCache };
export type CoursesPage = { items: any[]; total: number; totalPages: number };

async function withDefaults(opts?: FetchOpts): Promise<RequestInit> {
  const baseHeaders = new Headers(await authHeaders());
  if (opts?.headers) {
    const extra = new Headers(opts.headers as HeadersInit);
    extra.forEach((value, key) => baseHeaders.set(key, value));
  }
  return {
    cache: opts?.cache ?? 'no-store',
    headers: baseHeaders,
    credentials: 'include',
  };
}

const PAGE_SIZE = 12;

export function coursesPath(page = 1, perPage = PAGE_SIZE) {
  const qs = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  return `/api/wp/wp-json/bodhi/v1/courses?${qs.toString()}`;
}

export async function getCourses(opts?: { page?: number; per_page?: number }) {
  const url = await absoluteUrl(coursesPath(opts?.page ?? 1, opts?.per_page ?? PAGE_SIZE));
  const hdr = await authHeaders();

  const res = await fetch(url, { cache: 'no-store', headers: hdr });
  const data = await parseJsonStrict(res);

  const items: any[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : [];
  const total = Number(res.headers.get('X-WP-Total') ?? items.length);
  const totalPages = Number(res.headers.get('X-WP-TotalPages') ?? 1);

  return { items, total, totalPages };
}

export async function getCourseById(id: number, opts?: FetchOpts): Promise<CourseDetail> {
  const res = await fetch(
    await absoluteUrl(`/api/wp/wp-json/bodhi/v1/courses/${id}`),
    await withDefaults(opts),
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`API course ${id} ${res.status}: ${txt.slice(0, 200)}`);
  }
  const raw = await parseJsonStrict(res);
  return normalizeCourse(raw);
}

export async function getProgressByCourse(id: number, opts?: FetchOpts): Promise<ProgressRes> {
  const res = await fetch(
    await absoluteUrl(`/api/wp/wp-json/bodhi/v1/progress?course_id=${id}`),
    await withDefaults(opts),
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`API progress ${id} ${res.status}: ${txt.slice(0, 200)}`);
  }
  const raw = await parseJsonStrict(res);
  return normalizeProgress(raw, id);
}

export async function getMe(opts?: FetchOpts): Promise<Me> {
  const res = await fetch(
    await absoluteUrl('/api/wp/wp-json/bodhi/v1/me'),
    await withDefaults(opts),
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`API me ${res.status}: ${txt.slice(0, 200)}`);
  }
  return parseJsonStrict(res);
}

export async function getLessonById(
  courseId: number,
  lessonId: number,
  opts?: FetchOpts,
): Promise<Lesson | null> {
  const [course, progress] = await Promise.all([
    getCourseById(courseId, opts),
    getProgressByCourse(courseId, opts),
  ]);

  const rawLesson = course.lessons?.find((lesson) => lesson.id === lessonId);
  if (!rawLesson) return null;

  return {
    ...rawLesson,
    done: !!progress.progress[String(lessonId)],
    courseId,
    courseTitle: course.title,
  };
}
