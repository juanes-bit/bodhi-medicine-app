import { wpGet, wpPost } from "./wp";

export async function listMyCourses() {
  try {
    const res = await wpGet("/wp-json/bodhi/v1/my-courses");
    const items = Array.isArray(res?.items) ? res.items : [];
    const itemsOwned = Array.isArray(res?.itemsOwned)
      ? res.itemsOwned
      : items.filter((item) => item?.isOwned);
    return {
      items,
      itemsOwned,
      total: items.length,
      owned: itemsOwned.length,
    };
  } catch (error) {
    console.log("[listMyCourses error]", error?.message || error);
    return { items: [], itemsOwned: [], total: 0, owned: 0 };
  }
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

export async function me() {
  return wpGet("/wp-json/bodhi/v1/me");
}

export default function BodhiDataModule() {
  return null;
}
