'use client';
import { useEffect, useState } from 'react';
import { Link } from 'expo-router';
import { api, type CourseListItem } from '@/lib/api';

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [loading, setL] = useState(true);
  const [error, setE] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api('/wp-json/bodhi/v1/courses');
        const list: CourseListItem[] = Array.isArray(data) ? data : (data?.items ?? []);
        setCourses(list);
      } catch (err: any) {
        setE(err?.message ?? 'Error cargando cursos');
      } finally { setL(false); }
    })();
  }, []);

  if (loading) return <main style={{padding:24}}>Cargando…</main>;
  if (error) return <main style={{padding:24, color:'crimson'}}>{error}</main>;
  if (!courses.length) return <main style={{padding:24}}>No tienes cursos aún.</main>;

  return (
    <main style={{padding:24}}>
      <h1>Mis cursos</h1>
      <ul style={{display:'grid', gap:16, gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))'}}>
        {courses.map(c => (
          <li key={c.id} style={{border:'1px solid #ddd', borderRadius:8, padding:16}}>
            <h3 style={{marginTop:0}}>{c.title}</h3>
            <span style={{fontSize:12, opacity:.7}}>Acceso: {c.access}</span><br/>
            <Link href={`/courses/${c.id}`}>Ver detalle</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
