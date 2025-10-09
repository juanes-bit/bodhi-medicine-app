import Link from 'next/link';
import { getCourses } from '@/app/lib/api';

type PageProps = { searchParams: Promise<{ page?: string }> };

export default async function Page({ searchParams }: PageProps) {
  const { page } = await searchParams;
  const p = Number.isFinite(Number(page)) ? Math.max(1, Number(page ?? 1)) : 1;

  const { items, totalPages } = await getCourses({ page: p, per_page: 12 });
  const maximum = Math.max(1, totalPages || 1);

  return (
    <main className="grid gap-4 p-6">
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c: any) => (
          <article key={c.id} className="flex flex-col rounded-xl border border-neutral-700 p-4">
            <h3 className="font-semibold">{c.title}</h3>
            {c.thumb ? (
              <img
                src={c.thumb}
                alt=""
                className="mt-2 h-40 w-full rounded-md object-cover"
              />
            ) : null}
            <Link
              href={`/courses/${c.id}`}
              className="mt-3 inline-block underline"
              prefetch={false}
            >
              Ver curso
            </Link>
          </article>
        ))}
        {!items.length && (
          <p className="col-span-full text-sm text-neutral-400">
            No tienes cursos asignados todavía.
          </p>
        )}
      </section>

      <nav className="flex items-center justify-between py-4 text-sm">
        <Link
          aria-disabled={p <= 1}
          href={p <= 1 ? '#' : `/courses?page=${p - 1}`}
          className={`underline ${p <= 1 ? 'pointer-events-none opacity-50' : ''}`}
          prefetch={false}
        >
          ← Anterior
        </Link>
        <span>
          Página {p} / {maximum}
        </span>
        <Link
          aria-disabled={p >= maximum}
          href={p >= maximum ? '#' : `/courses?page=${p + 1}`}
          className={`underline ${p >= maximum ? 'pointer-events-none opacity-50' : ''}`}
          prefetch={false}
        >
          Siguiente →
        </Link>
      </nav>
    </main>
  );
}
