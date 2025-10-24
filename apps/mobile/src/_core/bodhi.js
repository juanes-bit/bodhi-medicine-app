import { wpFetch, wpPost } from "./wp";

const asArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && Array.isArray(value.items)) return value.items;
  return [];
};

export async function listMyCourses() {
  try {
    const data = await wpFetch("/wp-json/bodhi/v1/my-courses", {
      includeNonce: false,
    });

    const items = asArray(data).map((course) => {
      const owned = !!course?.is_owned || course?.access === "owned";
      return {
        id: course?.id,
        title: course?.title ?? "",
        image: course?.image ?? null,
        percent: Number(course?.percent ?? 0) || 0,
        isOwned: owned,
        access: owned ? "owned" : "locked",
      };
    });

    const itemsOwned = items.filter((item) => item.isOwned);

    return {
      items,
      itemsOwned,
      total: items.length,
      owned: itemsOwned.length,
    };
  } catch (error) {
    console.log("[listMyCourses error]", String(error));
    return { items: [], itemsOwned: [], total: 0, owned: 0 };
  }
}

export async function getCourse(courseId) {
  return await wpFetch(`/wp-json/bodhi/v1/courses/${courseId}`, { includeNonce: false });
}

export async function getProgress(courseId) {
  return await wpFetch(`/wp-json/bodhi/v1/progress?course_id=${courseId}`, { includeNonce: false });
}

export async function setProgress(courseId, lessonId, done = true) {
  return await wpPost("/wp-json/bodhi/v1/progress", {
    course_id: courseId,
    lesson_id: lessonId,
    completed: !!done,
  });
}

export async function me() {
  return await wpFetch("/wp-json/bodhi/v1/me", { includeNonce: false });
}

export default function BodhiDataModule() {
  return null;
}
