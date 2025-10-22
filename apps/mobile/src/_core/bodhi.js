import { wpGet, wpPost } from "./wpClient";

const COURSES_MODE = "union";
const PER_PAGE = 50;

const normAccess = (access) =>
  ["owned", "member", "free", "owned_by_product"].includes(
    String(access || "").toLowerCase(),
  )
    ? "owned"
    : "locked";

export function adaptCourseCard(course = {}) {
  const access = normAccess(course.access);
  return {
    id: course.id,
    title: course.title ?? course.name ?? "Curso",
    image: course.thumb ?? course.thumbnail ?? course.image ?? null,
    percent: typeof course.percent === "number" ? course.percent : 0,
    access,
    isOwned: access === "owned",
    _debug_access_reason: course.access_reason ?? null,
  };
}

export async function listMyCourses({ page = 1 } = {}) {
  const res = await wpGet(
    `/wp-json/bodhi/v1/courses?mode=${COURSES_MODE}&per_page=${PER_PAGE}&page=${page}`,
  );

  if (res && typeof res === "object" && res.code && res.data?.status >= 400) {
    console.log("[courses error]", res.code, res.data.status, res.message);
    return { items: [] };
  }

  const raw = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  const items = raw.map(adaptCourseCard);
  console.log(
    "[courses]",
    items.length,
    items
      .slice(0, 3)
      .map((item) => ({ id: item.id, access: item.access, reason: item._debug_access_reason })),
  );
  return { items };
}

export async function getCourse(courseId) {
  return await wpGet(`/wp-json/bodhi/v1/courses/${courseId}`);
}

export async function getProgress(courseId) {
  return await wpGet(`/wp-json/bodhi/v1/progress?course_id=${courseId}`);
}

export async function setProgress(courseId, lessonId, done = true) {
  return await wpPost("/wp-json/bodhi/v1/progress", {
    course_id: courseId,
    lesson_id: lessonId,
    completed: !!done,
  });
}

export async function me() {
  return await wpGet("/wp-json/bodhi/v1/me");
}

export default function BodhiDataModule() {
  return null;
}
