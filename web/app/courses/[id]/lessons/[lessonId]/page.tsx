'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  type CourseDetail,
  getCourse,
  getProgress,
  setProgress,
} from '@/lib/bodhi';
import { useAuth } from '@/hooks/useAuth';
import Skeleton from '@/components/Skeleton';

type ProgressMap = Record<string, boolean>;

export default function LessonPage() {
  const params = useParams<{ id: string; lessonId: string }>();
  const router = useRouter();
  const courseId = Number(params.id);
  const lessonId = Number(params.lessonId);

  const { loading: authLoading } = useAuth({ redirectTo: '/login' });

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgressState] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [c, p] = await Promise.all([
          getCourse(courseId),
          getProgress(courseId),
        ]);
        if (!alive) return;
        setCourse(c);
        setProgressState(p.progress ?? {});
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message ?? 'No se pudo cargar la lección.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [courseId]);

  const lesson = useMemo(
    () => (course?.lessons ?? []).find((item) => item.id === lessonId) ?? null,
    [course, lessonId],
  );

  async function markDone() {
    try {
      const res = await setProgress(courseId, lessonId, true);
      setProgressState(res.progress ?? {});
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo actualizar el progreso.');
    }
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-80" />
        <Skeleton className="h-[60vh] w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 text-red-500">
        <p>{error}</p>
        <button
          className="underline"
          onClick={() => router.back()}
          type="button"
        >
          Volver
        </button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-4">
        <p>No encontramos esta lección.</p>
        <button className="underline" onClick={() => router.back()} type="button">
          Volver
        </button>
      </div>
    );
  }

  const done = !!progress[String(lesson.id)];

  return (
    <div className="space-y-4">
      <Link
        href={`/courses/${courseId}`}
        className="text-sm text-neutral-400 hover:underline"
      >
        ← Volver al curso
      </Link>

      <h1 className="text-2xl font-semibold">{lesson.title}</h1>

      {lesson.url ? (
        <div className="aspect-video w-full overflow-hidden rounded border border-neutral-700">
          <iframe
            src={lesson.url}
            title={lesson.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
      ) : (
        <div className="rounded border border-neutral-700 p-4 text-sm text-neutral-400">
          Esta lección no tiene contenido multimedia disponible.
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={markDone}
          className={`rounded px-3 py-2 text-sm border ${
            done
              ? 'border-emerald-500 text-emerald-400'
              : 'border-neutral-600 text-neutral-200'
          }`}
          disabled={done}
          type="button"
        >
          {done ? '✓ Ya marcado' : 'Marcar como visto'}
        </button>
      </div>
    </div>
  );
}
