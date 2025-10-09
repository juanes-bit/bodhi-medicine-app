import { absoluteUrl, authHeaders, parseJsonStrict } from '@/app/lib/http';
import { normalizeCourse, normalizeProgress } from '@/app/lib/normalizers';
import type { CourseDetail, ProgressRes, Me } from '@/app/types/course';
import type { Lesson } from '@/app/types/lesson';

export type FetchOpts = { cache?: RequestCache };
export type CoursesPage = { items: any[]; total: number; totalPages: number };

async function withDefaults(opts?: FetchOpts): Promise<RequestInit> {
  const baseHeaders = new Headers(await authHeaders());
  if (opts?.headers) {
    const extra = new Headers(opts.headers as HeadersInit);
    extra.forEach((value, key) => baseHeaders.set(key, value));
  }
  return {
    cache: opts?.cache ?? 'no-store',
    headers: baseHeaders,
    credentials: 'include',
  };
}

const PAGE_SIZE = 12;

export function coursesPath(page = 1, perPage = PAGE_SIZE) {
  const qs = new URLSearchParams({ page: String(page), per_page: String(perPage) });
  return `/api/wp/wp-json/bodhi/v1/courses?${qs.toString()}`;
}

function asArray(x: any): any[] {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.items)) return x.items;
  return [];
}

async function tryTVA(urls: string[], hdr: HeadersInit) {
  for (const u of urls) {
    try {
      const res = await fetch(await absoluteUrl(u), { cache: 'no-store', headers: hdr });
      if (!res.ok) continue;
      const data = await parseJsonStrict(res);
      const arr = asArray(data);
      if (arr.length) return { data, arr };
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function getCourses(opts?: { page?: number; per_page?: number }) {
  const page = opts?.page ?? 1;
  const perPage = opts?.per_page ?? PAGE_SIZE;
  const hdr = await authHeaders();

  const primaryUrl = await absoluteUrl(coursesPath(page, perPage));
  const primaryRes = await fetch(primaryUrl, { cache: 'no-store', headers: hdr });
  const primary = await parseJsonStrict(primaryRes);

  let items: any[] = asArray(primary);

  if (items.length === 0) {
    const meRes = await fetch(await absoluteUrl('/api/wp/wp-json/bodhi/v1/me'), {
      cache: 'no-store',
      headers: hdr,
    });
    const me = await parseJsonStrict(meRes);
    const uid = Number(me?.id ?? me?.user_id ?? 0);

    const productCandidates = [
      `/api/wp/wp-json/tva/v1/customer/${uid}/products`,
      `/api/wp/wp-json/tva/v1/customers/${uid}/products`,
      `/api/wp/wp-json/tva/v1/customer/products`,
      `/api/wp/wp-json/tva/v2/customers/${uid}/products`,
    ];
    const prod = await tryTVA(productCandidates, hdr);
    const products = prod ? asArray(prod.data) : [];

    const productIds = Array.from(
      new Set(
        products
          .map((p: any) => p?.id ?? p?.ID ?? p?.product_id)
          .filter((x: any) => Number.isFinite(Number(x)))
          .map((x: any) => Number(x)),
      ),
    );

    const courseIdSet = new Set<number>();
    await Promise.all(
      productIds.map(async (pid) => {
        const variants = [
          `/api/wp/wp-json/tva/v1/products/${pid}/courses`,
          `/api/wp/wp-json/tva/v2/products/${pid}/courses`,
        ];
        const c = await tryTVA(variants, hdr);
        const rows = c ? asArray(c.data) : [];
        rows.forEach((r: any) => {
          const cid = Number(r?.id ?? r?.ID ?? r?.course_id);
          if (Number.isFinite(cid)) courseIdSet.add(cid);
        });
      }),
    );

    const courseIds = Array.from(courseIdSet);
    const detailed = await Promise.all(
      courseIds.map(async (cid) => {
        const variants = [
          `/api/wp/wp-json/tva-public/v1/courses/${cid}`,
          `/api/wp/wp-json/tva/v1/courses/${cid}`,
        ];
        const det = await tryTVA(variants, hdr);
        const c = det?.arr?.[0] ?? det?.data ?? null;

        return c
          ? {
              id: cid,
              title:
                typeof c.title === 'object'
                  ? c.title?.rendered ?? ''
                  : c.title ?? '',
              slug: c.slug ?? '',
              thumb: c.cover?.url ?? c.featured_image ?? null,
              access: 'owned',
              type: 'tva_course',
            }
          : {
              id: cid,
              title: `Curso ${cid}`,
              slug: '',
              thumb: null,
              access: 'owned',
              type: 'tva_course',
            };
      }),
    );

    items = detailed;
  }

  const total = Number(primaryRes.headers.get('X-WP-Total') ?? items.length);
  const totalPages = Number(primaryRes.headers.get('X-WP-TotalPages') ?? 1);

  return { items, total, totalPages };
}

export async function getCourseById(id: number, opts?: FetchOpts): Promise<CourseDetail> {
  const res = await fetch(
    await absoluteUrl(`/api/wp/wp-json/bodhi/v1/courses/${id}`),
    await withDefaults(opts),
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`API course ${id} ${res.status}: ${txt.slice(0, 200)}`);
  }
  const raw = await parseJsonStrict(res);
  return normalizeCourse(raw);
}

export async function getProgressByCourse(id: number, opts?: FetchOpts): Promise<ProgressRes> {
  const res = await fetch(
    await absoluteUrl(`/api/wp/wp-json/bodhi/v1/progress?course_id=${id}`),
    await withDefaults(opts),
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`API progress ${id} ${res.status}: ${txt.slice(0, 200)}`);
  }
  const raw = await parseJsonStrict(res);
  return normalizeProgress(raw, id);
}

export async function getMe(opts?: FetchOpts): Promise<Me> {
  const res = await fetch(
    await absoluteUrl('/api/wp/wp-json/bodhi/v1/me'),
    await withDefaults(opts),
  );
  if (!res.ok) {
    const txt = await res.text().catch(() => res.statusText);
    throw new Error(`API me ${res.status}: ${txt.slice(0, 200)}`);
  }
  return parseJsonStrict(res);
}

export async function getLessonById(
  courseId: number,
  lessonId: number,
  opts?: FetchOpts,
): Promise<Lesson | null> {
  const [course, progress] = await Promise.all([
    getCourseById(courseId, opts),
    getProgressByCourse(courseId, opts),
  ]);

  const rawLesson = course.lessons?.find((lesson) => lesson.id === lessonId);
  if (!rawLesson) return null;

  return {
    ...rawLesson,
    done: !!progress.progress[String(lessonId)],
    courseId,
    courseTitle: course.title,
  };
}
