import { wpGet, wpPost } from "./wpClient";

const OWNED = new Set(["owned", "member", "free", "owned_by_product"]);

export function adaptCourseCard(course = {}) {
  const access = (course.access ?? course.access_status ?? "").toString().toLowerCase();
  const isOwned = OWNED.has(access) || !!course.is_owned;
  return {
    id: course.id,
    title: course.title ?? "",
    image: course.image ?? null,
    percent: typeof course.percent === "number" ? course.percent : 0,
    access: isOwned ? "owned" : "locked",
    isOwned,
  };
}

export async function listMyCourses({ perPage = 10 } = {}) {
  try {
    const data = await wpGet(`/wp-json/bodhi/v1/my-courses?per_page=${perPage}`);
    const items = Array.isArray(data?.items) ? data.items.map(adaptCourseCard) : [];
    const ownedItems = items.filter((item) => item.isOwned);
    return {
      items,
      itemsOwned: ownedItems,
      owned: ownedItems.length,
      total: Number.isFinite(data?.total) ? data.total : items.length,
    };
  } catch (error) {
    return { items: [], itemsOwned: [], owned: 0, total: 0, _error: String(error) };
  }
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
