import type { CourseDetail, CourseModule, ProgressRes } from '@/app/types/course';
import type { Lesson, LessonMedia } from '@/app/types/lesson';

function toNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function clampPercentage(value?: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value as number)));
}

function parseDownloads(input: unknown): LessonMedia['downloads'] | undefined {
  if (!Array.isArray(input)) return undefined;
  const items = input
    .map((entry) => {
      const quality = typeof entry?.quality === 'string' ? entry.quality : entry?.label;
      const url = typeof entry?.url === 'string' ? entry.url : undefined;
      if (!url) return null;
      if (quality === '720p' || quality === '1080p' || quality === 'hls') {
        return { quality, url };
      }
      return null;
    })
    .filter((item): item is { quality: '720p' | '1080p' | 'hls'; url: string } => !!item);
  return items.length ? items : undefined;
}

export function extractVimeoMedia(
  mediaData: any,
  url?: string,
): LessonMedia | undefined {
  const fromMedia =
    mediaData && typeof mediaData === 'object' && mediaData.provider === 'vimeo'
      ? {
          provider: 'vimeo' as const,
          id: String(mediaData.id ?? mediaData.video_id ?? mediaData.videoId ?? ''),
          h: typeof mediaData.h === 'string' ? mediaData.h : undefined,
          downloads: parseDownloads(mediaData.downloads),
        }
      : undefined;

  if (fromMedia?.id) {
    return fromMedia;
  }

  if (typeof url === 'string') {
    const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (match) {
      const hashMatch = url.match(/[?&]h=([\w-]+)/i);
      return {
        provider: 'vimeo',
        id: match[1],
        h: hashMatch ? hashMatch[1] : undefined,
      };
    }
  }

  return undefined;
}

export function normalizeLesson(
  raw: any,
  courseId: number,
  courseTitle?: string,
): Lesson {
  const id = toNumber(raw?.id) ?? 0;
  const moduleId =
    toNumber(raw?.moduleId ?? raw?.module_id ?? raw?.module?.id ?? raw?.module) ??
    undefined;
  const url = typeof raw?.url === 'string' ? raw.url : undefined;

  const lesson: Lesson = {
    id,
    title: typeof raw?.title === 'string' ? raw.title : `Lección ${id}`,
    moduleId,
    type: typeof raw?.type === 'string' ? raw.type : undefined,
    url,
    order: toNumber(raw?.order ?? raw?.position ?? raw?.lesson_order) ?? undefined,
    preview_url:
      typeof raw?.preview_url === 'string' ? raw.preview_url : raw?.previewUrl,
    courseId,
    courseTitle,
    done: typeof raw?.done === 'boolean' ? raw.done : undefined,
  };

  const media = extractVimeoMedia(raw?.media, url);
  if (media) {
    lesson.media = media;
  }

  return lesson;
}

function normalizeModule(raw: any): CourseModule {
  const id = toNumber(raw?.id ?? raw?.module_id) ?? 0;
  const lessons =
    Array.isArray(raw?.lessons) && raw.lessons.length
      ? raw.lessons.map((item: any) => ({
          id: toNumber(item?.id) ?? 0,
          title: typeof item?.title === 'string' ? item.title : `Lección ${item?.id ?? ''}`,
        }))
      : undefined;

  return {
    id,
    title: typeof raw?.title === 'string' ? raw.title : `Módulo ${id || ''}`,
    order: toNumber(raw?.order ?? raw?.position ?? raw?.module_order) ?? undefined,
    cover_image:
      typeof raw?.cover_image === 'string' ? raw.cover_image : raw?.coverImage,
    publish_date:
      typeof raw?.publish_date === 'string' ? raw.publish_date : raw?.publishDate,
    schema: Array.isArray(raw?.schema) ? raw.schema : undefined,
    lessons,
  };
}

export function normalizeCourse(raw: any): CourseDetail {
  const id = toNumber(raw?.id) ?? 0;
  const title = typeof raw?.title === 'string' ? raw.title : undefined;

  const modules = Array.isArray(raw?.modules)
    ? raw.modules.map((module: any) => normalizeModule(module))
    : undefined;

  const lessons = Array.isArray(raw?.lessons)
    ? raw.lessons.map((lesson: any) => normalizeLesson(lesson, id, title))
    : undefined;

  return {
    id,
    title,
    modules,
    lessons,
  };
}

export function normalizeProgress(
  raw: any,
  fallbackCourseId?: number,
): ProgressRes {
  const progressMap: Record<string, boolean> = {};

  if (raw?.progress && typeof raw.progress === 'object') {
    Object.entries(raw.progress).forEach(([key, value]) => {
      progressMap[key] = !!value;
    });
  }

  const lessonsArray = Array.isArray(raw?.lessons)
    ? raw.lessons
    : Array.isArray(raw?.items)
      ? raw.items
      : [];

  lessonsArray.forEach((entry: any) => {
    const id = entry?.id ?? entry?.lesson_id ?? entry?.lessonId;
    if (id === null || id === undefined) return;
    const key = String(id);
    const done =
      entry?.done ?? entry?.completed ?? entry?.status ?? entry?.progress ?? false;
    progressMap[key] = !!done;
  });

  const summary = raw?.summary ?? {};
  const pctSource = toNumber(summary.pct ?? raw?.pct);
  const totalSource =
    toNumber(summary.total ?? raw?.total) ??
    (Array.isArray(lessonsArray) ? lessonsArray.length : undefined) ??
    Object.keys(progressMap).length;
  const doneSource =
    toNumber(summary.done ?? raw?.done) ??
    Object.values(progressMap).reduce((acc, value) => acc + (value ? 1 : 0), 0);
  const courseId =
    toNumber(summary.course_id ?? raw?.course_id ?? fallbackCourseId) ??
    fallbackCourseId ??
    0;

  const pct =
    pctSource !== undefined
      ? clampPercentage(pctSource)
      : totalSource
        ? clampPercentage((doneSource / totalSource) * 100)
        : 0;

  return {
    pct,
    total: totalSource ?? 0,
    done: doneSource ?? 0,
    progress: progressMap,
    course_id: courseId,
  };
}
