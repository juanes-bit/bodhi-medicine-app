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

const MOBILE_NS = "/bodhi-mobile/v1";
const COURSES_URL = "/wp-json/bodhi/v1/courses?mode=union";

const pickId = (obj = {}) => {
  const candidates = [
    obj?.id,
    obj?.ID,
    obj?.course_id,
    obj?.wp_post_id,
    obj?.courseId,
    obj?.wpPostId,
  ];
  const numeric = candidates
    .map((value) => Number.parseInt(String(value), 10))
    .find(Number.isFinite);
  return Number.isFinite(numeric) ? numeric : (candidates.find(Boolean) ?? null);
};

export async function me() {
  // cookie-only endpoint
  return wpGet(`${MOBILE_NS}/me`, { nonce: false });
}

export async function listMyCourses() {
  try {
    const res = await wpGet(`${COURSES_URL}&_ts=${Date.now()}`);
    const rawItems = Array.isArray(res)
      ? res
      : Array.isArray(res?.items)
      ? res.items
      : [];

    const items = rawItems.map((entry = {}) => {
      const id = pickId(entry);
      const normalizedOwned =
        Boolean(entry?.isOwned) ||
        OWNED_ACCESS.has(String(entry?.access ?? "").toLowerCase()) ||
        Boolean(entry?.has_access) ||
        Boolean(entry?.access_granted);

      return {
        id,
        title: entry?.title ?? entry?.name ?? entry?.post_title ?? "",
        image: entry?.cover_image ?? entry?.image ?? entry?.thumbnail ?? null,
        isOwned: normalizedOwned,
        access: normalizedOwned ? "owned" : "locked",
        _raw: entry,
      };
    });

    const itemsOwned = items.filter((item) => item.isOwned);
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
