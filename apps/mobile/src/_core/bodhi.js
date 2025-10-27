import { wpGet, wpPost } from "./wp";

// Normaliza bandera de acceso desde distintas formas del backend
const OWNED_ACCESS = new Set(["owned", "member", "free"]);
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

const MOBILE_NS = "/bodhi-mobile/v1";

export async function me() {
  // cookie-only endpoint
  return wpGet(`${MOBILE_NS}/me`, { nonce: false });
}

export async function listMyCourses() {
  try {
    const res = await wpGet(`${MOBILE_NS}/my-courses`, { nonce: false });
    const raw = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
    const items = raw.map((course = {}) => ({
      ...course,
      isOwned: normalizeOwned(course),
    }));
    const itemsOwned = items.filter((course) => course.isOwned);
    return { items, itemsOwned, total: items.length, owned: itemsOwned.length };
  } catch (error) {
    console.log("[listMyCourses error]", error.message || error);
    return { items: [], itemsOwned: [], total: 0, owned: 0 };
  }
}

export function adaptCourseCard(course = {}) {
  const isOwned = normalizeOwned(course);
  const access = course.access ?? (isOwned ? "owned" : "locked");
  return {
    id: course.id ?? course.ID,
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
