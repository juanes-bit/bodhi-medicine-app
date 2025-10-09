import Link from 'next/link';
import { getCourses } from '@/app/lib/api';

type PageProps = { searchParams: Promise<{ page?: string }> };

export default async function Page({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const p = Math.max(1, Number(page ?? 1));

  const { items } = await getCourses({ page: p, per_page: 12 });
  const courses = items.filter((i: any) => i?.type === 'tva_course');

  if (!courses.length) {
    return <main className="p-6">No tienes cursos asignados todavía.</main>;
  }

  return (
    <main className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((c: any) => (
        <article key={c.id} className="rounded-xl border p-4">
          <h3 className="font-semibold">{c.title}</h3>
          {c.thumb ? <img src={c.thumb} alt="" className="mt-2 rounded-md" /> : null}
          <Link href={`/courses/${c.id}`} className="mt-3 inline-block underline" prefetch={false}>
            Ver curso
          </Link>
        </article>
      ))}
    </main>
  );
}
