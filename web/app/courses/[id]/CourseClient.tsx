'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  getCourse,
  getProgress,
  setProgress,
  type CourseDetail,
} from '@/lib/bodhi';

type ProgressMap = Record<string, boolean>;

type CourseClientProps = {
  courseId: number;
};

export default function CourseClient({ courseId }: CourseClientProps) {
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgressState] = useState<ProgressMap>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const validCourseId = Number.isFinite(courseId) && courseId > 0;

  useEffect(() => {
    if (!validCourseId) {
      setCourse(null);
      setProgressState({});
      setLoading(false);
      setError('Curso inválido.');
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const courseData = await getCourse(courseId);
        const progressData = await getProgress(courseId);

        if (!isMounted) return;

        setCourse(courseData);
        const map =
          progressData.progress && typeof progressData.progress === 'object'
            ? (progressData.progress as ProgressMap)
            : {};
        setProgressState(map);
      } catch (err: any) {
        if (!isMounted) return;
        setError(err?.message ?? 'No se pudo cargar el curso.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [courseId, validCourseId]);

  const modules = useMemo(() => {
    if (!course) return [];

    type CourseLesson = CourseDetail['lessons'][number];
    const moduleMap = new Map<
      number,
      { id: number; title: string; order: number; lessons: CourseLesson[] }
    >();

    course.modules?.forEach((mod, index) => {
      moduleMap.set(mod.id, {
        id: mod.id,
        title: mod.title,
        order: mod.order ?? index,
        lessons: [],
      });
    });

    course.lessons?.forEach((lesson) => {
      if (!lesson) return;
      const current = moduleMap.get(lesson.moduleId);
      if (current) {
        current.lessons.push(lesson as CourseLesson);
        return;
      }

      const fallbackId = lesson.moduleId ?? -1;
      const existingFallback = moduleMap.get(fallbackId);
      if (existingFallback) {
        existingFallback.lessons.push(lesson as CourseLesson);
        return;
      }

      moduleMap.set(fallbackId, {
        id: fallbackId,
        title: 'Lecciones',
        order: Number.MAX_SAFE_INTEGER,
        lessons: [lesson as CourseLesson],
      });
    });

    return Array.from(moduleMap.values())
      .sort((a, b) => a.order - b.order)
      .map((mod) => ({
        ...mod,
        lessons: mod.lessons.slice().sort((a, b) => a.order - b.order),
      }));
  }, [course]);

  async function toggleLesson(lessonId: number) {
    try {
      const result = await setProgress(courseId, lessonId, true);
      const nextProgress =
        result.progress && typeof result.progress === 'object'
          ? (result.progress as ProgressMap)
          : {};
      if (Object.keys(nextProgress).length) {
        setProgressState(nextProgress);
      } else {
        setProgressState((prev) => ({ ...prev, [String(lessonId)]: true }));
      }
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo actualizar el progreso.');
    }
  }

  if (!validCourseId) return <div>Curso inválido.</div>;
  if (loading) return <div>Cargando…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!course) return <div>Curso no encontrado.</div>;

  return (
    <div className="space-y-6">
      {course.title && (
        <header>
          <h1 className="text-2xl font-bold">{course.title}</h1>
        </header>
      )}
      {!modules.length && (
        <p className="text-sm text-gray-500">
          Este curso aún no tiene módulos o lecciones disponibles.
        </p>
      )}
      {modules.map((mod) => (
        <section key={mod.id} className="space-y-2">
          <h2 className="text-xl font-semibold">{mod.title}</h2>
          <ul className="mt-2 space-y-2">
            {mod.lessons.map((lesson) => {
              const done = !!progress[String(lesson.id)];
              return (
                <li
                  key={lesson.id}
                  className="flex items-center gap-3 rounded border border-gray-200 px-3 py-2"
                >
                  <button
                    type="button"
                    onClick={() => toggleLesson(lesson.id)}
                    className="rounded border px-2 py-1"
                    disabled={done}
                  >
                    {done ? '✔' : '○'}
                  </button>
                  <span>{lesson.title}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
