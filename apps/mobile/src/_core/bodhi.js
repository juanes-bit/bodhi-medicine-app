import { wpGet, wpPost } from "./wp";

export async function listMyCourses() {
  try {
    const res = await wpGet("/wp-json/bodhi-mobile/v1/my-courses", { nonce: true });
    const items = Array.isArray(res?.items) ? res.items : [];
    const itemsOwned = Array.isArray(res?.itemsOwned)
      ? res.itemsOwned
      : items.filter((item) => item?.is_owned || item?.isOwned);
    const total = Number.isFinite(res?.total) ? res.total : items.length;
    const owned = Number.isFinite(res?.owned) ? res.owned : itemsOwned.length;
    return { items, itemsOwned, total, owned };
  } catch (error) {
    try {
      const unionResponse = await wpGet("/wp-json/bodhi/v1/courses?mode=union&per_page=50", {
        nonce: true,
      });
      const source = Array.isArray(unionResponse?.items)
        ? unionResponse.items
        : Array.isArray(unionResponse)
        ? unionResponse
        : [];
      const items = source.map((row = {}) => {
        const course = row.course || {};
        const status = row.access || course.access || course.access_status || "locked";
        const owned = Boolean(
          row.is_owned ||
            row.owned ||
            row.access_granted ||
            row.user_has_access ||
            course.is_owned ||
            course.owned ||
            course.access_granted ||
            course.user_has_access,
        );
        return {
          id: row.id || course.id || 0,
          title: row.title || course.name || course.title || "",
          image: row.image || course.thumb || course.image || null,
          percent: row.percent || course.percent || 0,
          access: owned ? "owned" : String(status).toLowerCase(),
          is_owned: owned,
        };
      });
      const itemsOwned = items.filter((item) => item.is_owned);
      return { items, itemsOwned, total: items.length, owned: itemsOwned.length };
    } catch (fallbackError) {
      console.log("[listMyCourses error]", fallbackError?.message || fallbackError || error);
      return { items: [], itemsOwned: [], total: 0, owned: 0 };
    }
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
