import { absoluteUrl, authHeaders, parseJsonStrict } from '@/app/lib/http';
import { normalizeCourse, normalizeProgress } from '@/app/lib/normalizers';
import { createLimiter, fetchWithTimeout } from '@/app/lib/net';
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
    const rowsById = new Map<number, any>();
    const limit = createLimiter(6);
    const seenUrl = new Set<string>();

    await Promise.all(
      productIds.map((pid) =>
        limit(async () => {
          const variants = [
            `/api/wp/wp-json/tva/v1/products/${pid}/courses`,
            `/api/wp/wp-json/tva/v2/products/${pid}/courses`,
          ];
          for (const u of variants) {
            if (seenUrl.has(u)) break;
            seenUrl.add(u);
            try {
              const res = await fetchWithTimeout(await absoluteUrl(u), { cache: 'no-store', headers: hdr }, 12000);
              if (!res.ok) continue;
              const data = await parseJsonStrict(res);
              const rows: any[] = Array.isArray(data) ? data : Array.isArray((data as any)?.items) ? (data as any).items : [];
              for (const r of rows) {
                const cid = Number(
                  r?.wp_post_id ??
                  r?.post_id ??
                  r?.course?.wp_post_id ??
                  r?.course?.post_id ??
                  r?.course_id ??
                  r?.id,
                );
                if (!Number.isFinite(cid)) continue;
                courseIdSet.add(cid);
                if (!rowsById.has(cid)) rowsById.set(cid, r);
              }
              break;
            } catch {
              // intenta el siguiente variant
            }
          }
        }),
      ),
    );

    const itemsFromTVA: any[] = Array.from(courseIdSet).map((cid) => {
      const r = rowsById.get(cid) || {};
      const titleRaw = r?.title ?? r?.course?.title ?? `Curso ${cid}`;
      const title =
        typeof titleRaw === 'object'
          ? titleRaw?.rendered ?? ''
          : String(titleRaw ?? '');
      const thumb = r?.cover?.url ?? r?.course?.cover?.url ?? r?.featured_image ?? null;

      return {
        id: cid,
        title,
        slug: r?.slug ?? r?.course?.slug ?? '',
        thumb,
        access: 'owned',
        type: 'tva_course',
      };
    });

    if (itemsFromTVA.length) {
      console.info(
        `[BODHI] fallback=TVA user-courses page=${page} perPage=${perPage} items=${itemsFromTVA.length}`,
      );
      items = itemsFromTVA;
    }
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
