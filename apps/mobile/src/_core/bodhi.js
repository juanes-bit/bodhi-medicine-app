import { wpGet, wpPost } from "./wp";

const adaptCourse = (raw = {}) => {
  const id = raw?.id ?? raw?.ID ?? null;
  const title = raw?.title?.rendered ?? raw?.title ?? "";
  const image = raw?.image ?? raw?.thumbnail ?? raw?.featured_image ?? null;
  const access = raw?.access ?? (raw?.isOwned ? "owned" : "locked");
  const isOwned =
    access === "owned" ||
    raw?.isOwned === true ||
    raw?.is_owned === true ||
    raw?.access_status === "granted";
  const percent = Number(raw?.progress?.percent ?? raw?.percent ?? 0) || 0;
  const reason = raw?.access_reason ?? raw?.reason ?? null;

  return {
    id,
    title,
    image,
    percent,
    access: isOwned ? "owned" : "locked",
    isOwned,
    r: reason,
  };
};

async function tvaOwnedSet() {
  try {
    // TODO: Ajustar a tu endpoint de TVA real cuando esté disponible.
    // Ejemplo:
    // const res = await wpGet('/wp-json/tva/v1/me/courses');
    // return new Set((res?.items ?? []).map((course) => Number(course.id)));
    return new Set();
  } catch {
    return new Set();
  }
}

export async function listMyCourses() {
  try {
    const res = await wpGet("/wp-json/bodhi/v1/courses?mode=union&per_page=50&debug=1");
    const rawItems = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];

    let items = rawItems.map(adaptCourse);

    if (!items.some((item) => item.isOwned)) {
      const ownedSet = await tvaOwnedSet();
      if (ownedSet.size) {
        items = items.map((item) =>
          ownedSet.has(Number(item.id))
            ? { ...item, isOwned: true, access: "owned" }
            : item
        );
      }
    }

    const itemsOwned = items.filter((item) => item.isOwned);

    return {
      items,
      itemsOwned,
      owned: itemsOwned.length,
      total: items.length,
      show: items.length,
    };
  } catch (error) {
    console.log("[listMyCourses error]", String(error));
    return { items: [], itemsOwned: [], owned: 0, total: 0, show: 0 };
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
