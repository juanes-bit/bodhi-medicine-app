import { notFound } from 'next/navigation';
import CourseClient from './CourseClient';
import {
  getCourseById,
  getProgressByCourse,
  getMe,
} from '@/app/lib/api';
import type { CourseDetail, ProgressRes, Me } from '@/app/types/course';

type PageParams = Promise<{ id: string }>;

export default async function Page({ params }: { params: PageParams }) {
  const { id } = await params;
  const courseId = Number(id);

  if (!Number.isFinite(courseId) || courseId <= 0) {
    notFound();
  }

  const [courseRes, progressRes, meRes] = await Promise.allSettled([
    getCourseById(courseId, { cache: 'no-store' }),
    getProgressByCourse(courseId, { cache: 'no-store' }),
    getMe({ cache: 'no-store' }),
  ]);

  const course =
    courseRes.status === 'fulfilled'
      ? (courseRes.value as CourseDetail)
      : null;
  const progress =
    progressRes.status === 'fulfilled'
      ? (progressRes.value as ProgressRes)
      : null;
  const me = meRes.status === 'fulfilled' ? (meRes.value as Me) : null;

  return (
    <CourseClient
      id={courseId}
      course={course}
      progress={progress}
      me={me}
    />
  );
}
