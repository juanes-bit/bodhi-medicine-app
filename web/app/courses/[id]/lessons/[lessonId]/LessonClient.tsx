'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import VimeoPlayer from '@/app/components/VimeoPlayer';
import { features } from '@/app/config/features';
import type { Lesson } from '@/app/types/lesson';
import type { Me } from '@/app/types/course';
import { setProgress } from '@/lib/bodhi';

type LessonClientProps = {
  lesson: Lesson | null;
  me: Me | null;
};

export default function LessonClient({ lesson, me }: LessonClientProps) {
  const router = useRouter();
  const [done, setDone] = useState<boolean>(() => !!lesson?.done);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDone(!!lesson?.done);
  }, [lesson?.done, lesson?.id]);

  if (!me?.logged_in) {
    return (
      <div className="space-y-2">
        <p>Necesitas iniciar sesión para ver esta lección.</p>
        <Link
          href="/login"
          className="text-emerald-400 underline hover:text-emerald-300"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="space-y-4">
        <p>No encontramos esta lección.</p>
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

  const courseId = lesson.courseId ?? 0;
  const courseHref = courseId ? `/courses/${courseId}` : '/courses';

  async function markDone() {
    if (!courseId || saving) return;
    try {
      setSaving(true);
      setError(null);
      await setProgress(courseId, lesson.id, true);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo actualizar el progreso.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href={courseHref}
        className="text-sm text-neutral-400 hover:underline"
      >
        ← Volver al curso
      </Link>

      <h1 className="text-2xl font-semibold">{lesson.title}</h1>
      {lesson.courseTitle && (
        <p className="text-sm text-neutral-400">{lesson.courseTitle}</p>
      )}

      {lesson.media?.provider === 'vimeo' ? (
        <VimeoPlayer
          id={lesson.media.id}
          h={lesson.media.h}
          title={lesson.title}
        />
      ) : lesson.url ? (
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

      {features.offline && lesson.media?.downloads?.length ? (
        <div className="space-y-2 rounded border border-neutral-700 p-3 text-sm text-neutral-300">
          <p>Descargas disponibles:</p>
          <ul className="space-y-1">
            {lesson.media.downloads.map((download) => (
              <li key={download.url}>
                <a
                  href={download.url}
                  download
                  className="text-emerald-400 underline hover:text-emerald-300"
                >
                  Descargar {download.quality}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          onClick={markDone}
          className={`rounded px-3 py-2 text-sm border ${
            done
              ? 'border-emerald-500 text-emerald-400'
              : 'border-neutral-600 text-neutral-200 hover:border-neutral-400'
          }`}
          disabled={done || saving || !courseId}
          type="button"
        >
          {done ? '✓ Ya marcado' : saving ? 'Guardando…' : 'Marcar como visto'}
        </button>
      </div>
    </div>
  );
}
