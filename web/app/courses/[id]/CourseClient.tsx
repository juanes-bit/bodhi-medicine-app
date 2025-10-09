'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { CourseDetail, ProgressRes, Me } from '@/app/types/course';
import type { Lesson } from '@/app/types/lesson';
import { setProgress } from '@/lib/bodhi';

type CourseClientProps = {
  id: number;
  course: CourseDetail | null;
  progress: ProgressRes | null;
  me: Me | null;
};

type ModuleStats = {
  total: number;
  done: number;
};

export default function CourseClient({
  id,
  course,
  progress,
  me,
}: CourseClientProps) {
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>(
    () => ({ ...(progress?.progress ?? {}) }),
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    setProgressMap(progress?.progress ? { ...progress.progress } : {});
  }, [progress?.progress]);

  const validId = Number.isFinite(id) && id > 0;

  const lessons = useMemo<Lesson[]>(() => course?.lessons ?? [], [course]);
  const modules = useMemo(() => course?.modules ?? [], [course]);

  const totals = useMemo(() => {
    const totalFromLessons = lessons.length;
    const fallbackTotal =
      typeof progress?.total === 'number' ? progress.total : 0;
    const total = totalFromLessons || fallbackTotal;

    const doneFromLessons = lessons.reduce(
      (acc, lesson) => acc + (progressMap[String(lesson.id)] ? 1 : 0),
      0,
    );
    const fallbackDone =
      typeof progress?.done === 'number' ? progress.done : doneFromLessons;
    const done = totalFromLessons ? doneFromLessons : fallbackDone;

    const pctBase =
      typeof progress?.pct === 'number' && Number.isFinite(progress.pct)
        ? Math.round(progress.pct)
        : total
          ? Math.round((done / total) * 100)
          : 0;
    const pct = Math.min(100, Math.max(0, pctBase));

    return { total, done, pct };
  }, [lessons, progressMap, progress?.pct, progress?.done, progress?.total]);

  const perModuleStats = useMemo(() => {
    const stats = new Map<number, ModuleStats>();
    modules.forEach((module) => stats.set(module.id, { total: 0, done: 0 }));

    lessons.forEach((lesson) => {
      if (lesson.moduleId === undefined || lesson.moduleId === null) return;
      const key = Number(lesson.moduleId);
      const entry = stats.get(key) ?? { total: 0, done: 0 };
      entry.total += 1;
      if (progressMap[String(lesson.id)]) entry.done += 1;
      stats.set(key, entry);
    });

    return stats;
  }, [modules, lessons, progressMap]);

  const ungroupedLessons = useMemo(() => {
    return lessons
      .filter((lesson) => lesson.moduleId === undefined || lesson.moduleId === null)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [lessons]);

  if (!validId) return <div>Curso inválido.</div>;

  if (!me?.logged_in) {
    return (
      <div className="space-y-2">
        <p>Necesitas iniciar sesión para acceder a este curso.</p>
        <Link
          href={`/login?next=/courses/${id}`}
          className="text-emerald-400 underline hover:text-emerald-300"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  if (!course) {
    return <div>Curso no encontrado.</div>;
  }

  async function markLessonAsDone(lessonId: number) {
    if (progressMap[String(lessonId)]) return;
    try {
      setSaving(lessonId);
      setError(null);
      const res = await setProgress(id, lessonId, true);
      const nextProgress = res.progress ?? {
        ...progressMap,
        [String(lessonId)]: true,
      };
      setProgressMap(nextProgress);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el progreso.',
      );
    } finally {
      setSaving(null);
    }
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

      {error && <p className="text-sm text-red-500">{error}</p>}

      {!modules.length && (
        <p className="text-sm text-neutral-500">
          Este curso aún no tiene módulos o lecciones disponibles.
        </p>
      )}

      {modules.map((module) => {
        const moduleLessons = lessons
          .filter((lesson) => lesson.moduleId === module.id)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        const stats = perModuleStats.get(module.id) ?? {
          total: moduleLessons.length,
          done: 0,
        };
        const complete = stats.total > 0 && stats.done === stats.total;

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
                  : `En curso ${stats.done}/${stats.total || moduleLessons.length}`}
              </span>
            </div>

            <div className="space-y-2">
              {moduleLessons.map((lesson) => {
                const done = !!progressMap[String(lesson.id)];
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
                        markLessonAsDone(lesson.id);
                      }}
                      className={`ml-3 rounded px-2 py-1 text-xs border transition ${
                        done
                          ? 'border-emerald-500 text-emerald-400'
                          : 'border-neutral-600 text-neutral-300 hover:border-neutral-400'
                      }`}
                      aria-pressed={done}
                      disabled={done || saving === lesson.id}
                      type="button"
                    >
                      {done ? '✓ Visto' : saving === lesson.id ? 'Guardando…' : 'Marcar visto'}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      {!!ungroupedLessons.length && (
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Lecciones</h2>
            <span className="text-xs rounded-full px-2 py-1 border border-neutral-600 text-neutral-400">
              {ungroupedLessons.length} pendiente(s)
            </span>
          </div>
          <div className="space-y-2">
            {ungroupedLessons.map((lesson) => {
              const done = !!progressMap[String(lesson.id)];
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
                      markLessonAsDone(lesson.id);
                    }}
                    className={`ml-3 rounded px-2 py-1 text-xs border transition ${
                      done
                        ? 'border-emerald-500 text-emerald-400'
                        : 'border-neutral-600 text-neutral-300 hover:border-neutral-400'
                    }`}
                    aria-pressed={done}
                    disabled={done || saving === lesson.id}
                    type="button"
                  >
                    {done ? '✓ Visto' : saving === lesson.id ? 'Guardando…' : 'Marcar visto'}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
