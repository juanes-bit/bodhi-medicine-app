'use client';
import { api, type CourseDetail, type Lesson, type ProgressRes } from '@/lib/api';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = Number(params.id);
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [progress, setProgress] = useState<ProgressRes | null>(null);
  const [loading, setL] = useState(true);
  const [error, setE] = useState<string | null>(null);

  const load = useCallback(async () => {
    setE(null);
    setL(true);
    try {
      const [c, p] = await Promise.all([
        api(`/wp-json/bodhi/v1/courses/${courseId}`),
        api(`/wp-json/bodhi/v1/progress?course_id=${courseId}`),
      ]);
      setCourse(c);
      setProgress(p);
    } catch (err: any) {
      setE(err?.message ?? 'Error cargando el curso');
    } finally {
      setL(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function markDone(lesson: Lesson) {
    try {
      await api('/wp-json/bodhi/v1/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, lesson_id: lesson.id }),
      });
      await load();
    } catch (err: any) {
      alert(err?.message ?? 'No se pudo marcar la lección');
    }
  }

  if (loading) return <main style={{ padding: 24 }}>Cargando…</main>;
  if (error) return <main style={{ padding: 24, color: 'crimson' }}>{error}</main>;
  if (!course) return <main style={{ padding: 24 }}>Curso no encontrado.</main>;

  const pct = progress?.summary?.pct ?? 0;

  return (
    <main style={{ padding: 24 }}>
      <h1>{course.title}</h1>
      <p>Progreso: {pct}%</p>

      {(!course.modules || course.modules.length === 0) && (
        <p style={{ opacity: 0.7 }}>
          Este curso aún no tiene módulos/lecciones para mostrar.
        </p>
      )}

      {(course.modules ?? []).map((m) => (
        <section key={m.id} style={{ margin: '16px 0', padding: '8px 0', borderTop: '1px solid #eee' }}>
          <h3 style={{ margin: '8px 0' }}>{m.title}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {m.lessons.map((l) => {
              const done = !!progress?.lessons?.some((pl) => pl.id === l.id && pl.done);
              return (
                <li
                  key={l.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0' }}
                >
                  <span style={{ flex: 1 }}>{l.title}</span>
                  <button onClick={() => markDone(l)} disabled={done}>
                    {done ? 'Completada' : 'Marcar completada'}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
