'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, type CourseListItem } from '@/lib/api';

const PID_CACHE_KEY = 'pid_access_cache_v1';
const PID_TTL_MS = 24 * 60 * 60 * 1000;

function readPidCache(): Record<string, { ok: boolean; ts: number }> {
  try {
    return JSON.parse(localStorage.getItem(PID_CACHE_KEY) || '{}');
  } catch {
    return {};
  }
}

function writePidCache(cache: Record<string, { ok: boolean; ts: number }>) {
  try {
    localStorage.setItem(PID_CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

async function allowedPidSet(pids: number[]): Promise<Set<number>> {
  const cache = readPidCache();
  const now = Date.now();
  const allowed = new Set<number>();
  const missing: number[] = [];

  for (const pid of pids) {
    const hit = cache[pid];
    if (hit && now - hit.ts < PID_TTL_MS) {
      if (hit.ok) allowed.add(pid);
    } else {
      missing.push(pid);
    }
  }

  const limit = 6;
  let idx = 0;
  const runBatch = async () => {
    while (idx < missing.length) {
      const i = idx++;
      const pid = missing[i];
      try {
        const res = await fetch(`/api/wp/wp-json/tva/v1/products/${pid}/courses`, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });
        const ok = res.status === 200;
        cache[pid] = { ok, ts: now };
        if (ok) allowed.add(pid);
      } catch {
        // dejamos sin cachear para reintentar luego
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(limit, missing.length) }, runBatch));
  writePidCache(cache);
  return allowed;
}

function uniqPIDs(items: any[]): number[] {
  const set = new Set<number>();
  for (const c of items) {
    const pid = Number(c?.source?.product_id);
    if (!Number.isNaN(pid)) set.add(pid);
  }
  return [...set];
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const resp = await api('/wp-json/bodhi/v1/courses');
        const items = resp?.items ?? [];
        const pids = uniqPIDs(items);
        const allowed = await allowedPidSet(pids);
        const filtered = items.filter((c: any) => allowed.has(Number(c?.source?.product_id)));
        setCourses(filtered);
      } catch (e: any) {
        setErr(e?.message ?? 'Error cargando cursos');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <main style={{ padding: 24 }}>Cargando…</main>;
  if (error) return <main style={{ padding: 24, color: 'crimson' }}>{error}</main>;
  if (!courses.length) return <main style={{ padding: 24 }}>No tienes cursos aún.</main>;

  return (
    <main style={{ padding: 24 }}>
      <h1>Mis cursos</h1>
      <ul
        style={{
          display: 'grid',
          gap: 16,
          gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))',
        }}
      >
        {courses.map((c) => (
          <li key={c.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>{c.title}</h3>
            <span style={{ fontSize: 12, opacity: 0.7 }}>Acceso: {c.access}</span>
            <br />
            <Link href={`/courses/${c.id}`}>Ver detalle</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
