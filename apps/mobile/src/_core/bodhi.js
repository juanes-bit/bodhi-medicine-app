import { wpGet, wpPost } from "./wp";

const OWNED_ACCESS = new Set(["owned", "member", "free"]);

// === Normalizadores consistentes ===
export function normalizeOwned(course = {}) {
  return Boolean(
    course.isOwned ??
      course.is_owned ??
      course.owned ??
      course.access_granted ??
      course.user_has_access ??
      course.owned_by_product ??
      (typeof course.access === "string" && OWNED_ACCESS.has(course.access)),
  );
}

export function normalizeId(c = {}) {
  const raw =
    c.id ??
    c.ID ??
    c.courseId ??
    c.course_id ??
    c.wp_post_id ??
    c.post_id ??
    c.wp_postId ??
    c.wpPostId;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : String(raw ?? "");
}

function markOwned(items = [], ownedList = []) {
  const ownedIds = new Set((ownedList || []).map(normalizeId).filter(Boolean));
  return items.map((c = {}) => {
    const id = normalizeId(c);
    const fromSet = ownedIds.has(id);
    const isOwned = fromSet || normalizeOwned(c);
    const access = isOwned ? "owned" : c.access ?? "locked";
    return { ...c, id, isOwned, access };
  });
}

const MOBILE_NS = "/bodhi-mobile/v1";

export async function me() {
  // cookie-only endpoint
  return wpGet(`${MOBILE_NS}/me`, { nonce: false });
}

// Intenta ambos namespaces "my-courses"
async function fetchMyCoursesRaw() {
  const paths = [
    "/wp-json/bodhi-mobile/v1/my-courses",
    "/wp-json/bodhi/v1/my-courses",
  ];
  for (const p of paths) {
    try {
      const r = await wpGet(p, { nonce: false });
      if (!r?.code || r?.data?.status !== 404) return r;
    } catch (_) {}
  }
  return null;
}

// Fallback: usa el contrato "union" (trae señales de acceso)
async function fetchCoursesUnion() {
  try {
    const r = await wpGet("/wp-json/bodhi/v1/courses?mode=union");
    const arr = Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : [];
    return arr.map((i = {}) => {
      const id = normalizeId(i);
      const isOwned = normalizeOwned(i);
      const access = isOwned ? "owned" : i.access ?? "locked";
      return { ...i, id, isOwned, access };
    });
  } catch {
    return [];
  }
}

export async function listMyCourses() {
  try {
    const res = await fetchMyCoursesRaw();
    const rawItems = Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res)
      ? res
      : [];
    const rawOwned = Array.isArray(res?.itemsOwned)
      ? res.itemsOwned
      : Array.isArray(res?.owned_list)
      ? res.owned_list
      : [];

    let items = markOwned(rawItems, rawOwned);
    let itemsOwned = items.filter((course) => course.isOwned);

    // Fallback inteligente: si no hay owned, consulta union y fusiona por ID
    if (items.length && itemsOwned.length === 0) {
      const unionItems = await fetchCoursesUnion();
      if (unionItems.length) {
        const uMap = new Map(unionItems.map((u) => [normalizeId(u), u]));
        items = items.map((c) => {
          const u = uMap.get(normalizeId(c));
          if (!u) return c;
          const isOwned = Boolean(u.isOwned);
          return {
            ...c,
            isOwned,
            access: isOwned ? "owned" : c.access ?? "locked",
          };
        });
        itemsOwned = items.filter((course) => course.isOwned);
      }
    }

    return { items, itemsOwned, total: items.length, owned: itemsOwned.length };
  } catch (error) {
    console.log("[listMyCourses error]", error?.message || error);
    return { items: [], itemsOwned: [], total: 0, owned: 0 };
  }
}

export function adaptCourseCard(course = {}) {
  const id = normalizeId(course);
  const isOwned = normalizeOwned(course);
  const access = course.access ?? (isOwned ? "owned" : "locked");
  return {
    id,
    title: course.title ?? course.name ?? course.post_title,
    image: course.image ?? course.cover_image,
    isOwned,
    access,
    percent: course.percent ?? course.progress?.pct ?? 0,
  };
}

export async function getCourse(courseId) {
  return wpGet(`/wp-json/bodhi/v1/courses/${courseId}`);
}

export async function getProgress(courseId) {
  return wpGet(`/wp-json/bodhi/v1/progress?course_id=${courseId}`);
}

export async function setProgress(courseId, lessonId, done = true) {
  return wpPost("/wp-json/bodhi/v1/progress", {
    course_id: courseId,
    lesson_id: lessonId,
    completed: !!done,
  });
}

export default function BodhiDataModule() {
  return null;
}
