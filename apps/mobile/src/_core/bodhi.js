import { wpGet, wpPost } from "./wp";

// --- helpers de identificación/propiedad (robustos) ---
const OWNED_ACCESS = new Set(["owned", "member", "free"]);

// Normaliza cualquier bandera conocida a booleano
export function normalizeOwned(course = {}) {
  return Boolean(
    course.isOwned ??
      course.is_owned ??
      course.owned ??
      course.access_granted ??
      course.user_has_access ??
      (typeof course.access === "string" && OWNED_ACCESS.has(course.access)),
  );
}

// Extrae un ID estable de múltiples formas (string/number)
export function normalizeId(c = {}) {
  const raw =
    c.id ?? c.ID ?? c.post_id ?? c.wp_post_id ?? c.course_id ?? c.wp_postId;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : String(raw ?? "");
}

// Marca isOwned en items usando itemsOwned (si existe) y/o flags internas
function markOwned(items = [], ownedList = []) {
  const ownedIds = new Set(
    (ownedList || [])
      .map(normalizeId)
      .filter((v) => v !== "" && v !== null && v !== "null"),
  );
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

// Intenta ambos namespaces; cae al siguiente si 404/no route.
async function fetchMyCoursesRaw() {
  const paths = [
    "/wp-json/bodhi-mobile/v1/my-courses",
    "/wp-json/bodhi/v1/my-courses",
  ];
  for (const p of paths) {
    try {
      const r = await wpGet(p, { nonce: false });
      if (!r?.code || r?.data?.status !== 404) return r;
    } catch (_e) {
      // intenta siguiente
    }
  }
  return null;
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
    const items = markOwned(rawItems, rawOwned);
    const itemsOwned = items.filter((course) => course.isOwned);
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
