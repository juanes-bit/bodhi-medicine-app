import CourseClient from './CourseClient';
import { getCourseById, getProgressByCourse, getMe } from '@/app/lib/api';

type PageParams = Promise<{ id: string }>;

export default async function Page({ params }: { params: PageParams }) {
  const { id } = await params;
  const courseId = Number(id);

  try {
    const [course, progress, me] = await Promise.all([
      getCourseById(courseId, { cache: 'no-store' }),
      getProgressByCourse(courseId, { cache: 'no-store' }),
      getMe({ cache: 'no-store' }),
    ]);

    if (!course || !course.id) {
      return (
        <main className="p-6">
          <p>No se pudo cargar el curso.</p>
          <a href={`/courses/${courseId}`} className="underline">
            Reintentar
          </a>
        </main>
      );
    }

    return <CourseClient id={courseId} course={course} progress={progress} me={me} />;
  } catch (error) {
    return (
      <main className="p-6">
        <p>No se pudo cargar el curso.</p>
        <a href={`/courses/${courseId}`} className="underline">
          Reintentar
        </a>
      </main>
    );
  }
}
