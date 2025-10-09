'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  type CourseDetail,
  getCourse,
  getProgress,
  setProgress,
} from '@/lib/bodhi';
import { useAuth } from '@/hooks/useAuth';
import Skeleton from '@/components/Skeleton';

type ProgressMap = Record<string, boolean>;

type CourseClientProps = {
  id: number;
};

export default function CourseClient({ id }: CourseClientProps) {
  const validId = Number.isFinite(id) && id > 0;

  const { loading: authLoading } = useAuth({ redirectTo: '/login' });
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgressState] = useState<ProgressMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!validId) {
      setCourse(null);
      setProgressState({});
      setError('Curso inválido.');
      setLoading(false);
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [courseRes, progressRes] = await Promise.all([
          getCourse(id),
          getProgress(id),
        ]);
        if (!alive) return;
        setCourse(courseRes);
        setProgressState(progressRes.progress ?? {});
      } catch (err: any) {
        if (!alive) return;
        setError(err?.message ?? 'No se pudo cargar el curso.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, validId]);

  const lessons = course?.lessons ?? [];
  const modules = course?.modules ?? [];

  const perModuleStats = useMemo(() => {
    const byModule = new Map<number, { total: number; done: number }>();
    modules.forEach((module) => byModule.set(module.id, { total: 0, done: 0 }));

    lessons.forEach((lesson) => {
      if (!lesson?.moduleId) return;
      const moduleKey = Number(lesson.moduleId);
      const current = byModule.get(moduleKey) ?? { total: 0, done: 0 };
      current.total += 1;
      if (progress[String(lesson.id)]) current.done += 1;
      byModule.set(moduleKey, current);
    });

    return byModule;
  }, [modules, lessons, progress]);

  const totals = useMemo(() => {
    const total = lessons.length;
    const done = lessons.reduce(
      (acc, lesson) => acc + (progress[String(lesson.id)] ? 1 : 0),
      0,
    );
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [lessons, progress]);

  async function toggle(lessonId: number) {
    const next = !progress[String(lessonId)];
    try {
      const res = await setProgress(id, lessonId, next);
      setProgressState(res.progress ?? {});
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo actualizar el progreso.');
    }
  }

  if (!validId) {
    return <div>Curso inválido.</div>;
  }

  if (authLoading || loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-3 w-full" />
        <div className="grid gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  if (!course) {
    return <div>Curso no encontrado.</div>;
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">{course.title ?? `Curso #${id}`}</h1>
        <div className="h-2 w-full rounded bg-neutral-800">
          <div
            className="h-2 rounded bg-rose-500 transition-all"
            style={{ width: `${totals.pct}%` }}
            aria-label={`Progreso ${totals.pct}%`}
          />
        </div>
        <p className="text-sm text-neutral-400">
          {totals.done}/{totals.total} lecciones • {totals.pct}%
        </p>
      </header>

      {modules.map((module) => {
        const stats = perModuleStats.get(module.id) ?? { total: 0, done: 0 };
        const complete = stats.total > 0 && stats.done === stats.total;

        const relatedLessons = lessons
          .filter((lesson) => lesson.moduleId === module.id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return (
          <section key={module.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{module.title}</h2>
              <span
                className={`text-xs rounded-full px-2 py-1 border ${
                  complete
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-amber-500 text-amber-400'
                }`}
              >
                {complete
                  ? 'Completado'
                  : `En curso ${stats.done}/${stats.total || relatedLessons.length}`}
              </span>
            </div>

            <div className="space-y-2">
              {relatedLessons.map((lesson) => {
                const done = !!progress[String(lesson.id)];
                const href = `/courses/${id}/lessons/${lesson.id}`;
                return (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between rounded border border-neutral-700 px-3 py-2 hover:border-neutral-500"
                  >
                    <Link href={href} className="flex-1">
                      <span className="truncate">{lesson.title}</span>
                    </Link>

                    <button
                      onClick={(event) => {
                        event.preventDefault();
                        toggle(lesson.id);
                      }}
                      className={`ml-3 rounded px-2 py-1 text-xs border ${
                        done
                          ? 'border-emerald-500 text-emerald-400'
                          : 'border-neutral-600 text-neutral-300'
                      }`}
                      aria-pressed={done}
                      type="button"
                    >
                      {done ? '✓ Visto' : 'Marcar visto'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
