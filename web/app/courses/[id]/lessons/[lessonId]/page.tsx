import { notFound } from 'next/navigation';
import LessonClient from './LessonClient';
import { getLessonById, getMe } from '@/app/lib/api';
import type { Lesson } from '@/app/types/lesson';
import type { Me } from '@/app/types/course';

type PageParams = Promise<{ id: string; lessonId: string }>;

export default async function Page({ params }: { params: PageParams }) {
  const { id, lessonId } = await params;
  const courseId = Number(id);
  const lessonNumericId = Number(lessonId);

  if (
    !Number.isFinite(courseId) ||
    courseId <= 0 ||
    !Number.isFinite(lessonNumericId) ||
    lessonNumericId <= 0
  ) {
    notFound();
  }

  const [lessonRes, meRes] = await Promise.allSettled([
    getLessonById(courseId, lessonNumericId, { cache: 'no-store' }),
    getMe({ cache: 'no-store' }),
  ]);

  const lesson =
    lessonRes.status === 'fulfilled' ? (lessonRes.value as Lesson | null) : null;
  const me = meRes.status === 'fulfilled' ? (meRes.value as Me) : null;

  return <LessonClient lesson={lesson} me={me} />;
}
