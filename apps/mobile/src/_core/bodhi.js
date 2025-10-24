import { wpGet, wpPost, ensureNonce } from "./wpClient";

const OWNED = new Set(['owned', 'member', 'free', 'owned_by_product']);
const asOwned = (access) => (OWNED.has(String(access ?? '').toLowerCase()) ? 'owned' : 'locked');

export function adaptCourseCard(course = {}) {
  const status = course.access ?? course.access_status ?? course.status;
  const hasFlag = [
    course.is_owned,
    course.isOwned,
    course.owned,
    course.access_granted,
    course.user_has_access,
  ].some(Boolean);

  const access = hasFlag ? 'owned' : asOwned(status);

  return {
    id: course.id,
    title: course.title ?? course.name ?? `Curso #${course.id ?? ''}`,
    image: course.thumb ?? course.thumbnail ?? course.image ?? null,
    percent: typeof course.percent === 'number' ? course.percent : 0,
    access,
    isOwned: access === 'owned',
    _debug_access_reason: course.access_reason ?? null,
  };
}

const toArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
  }
  return [];
};

export async function listMyCourses({ perPage = 50, allowLocked = true } = {}) {
  const url = `/wp-json/bodhi/v1/courses?mode=union&per_page=${perPage}`;
  try {
    let response = await wpGet(url);

    if (response?.code) {
      if (__DEV__)
        console.log("[courses union-error]", response.code, response?.data?.status, response?.message);
      await ensureNonce(true);
      response = await wpGet(url);
      if (response?.code) return { items: [], total: 0, owned: 0 };
    }

    const all = toArray(response).map(adaptCourseCard);
    const owned = all.filter((course) => course.isOwned);
    const items = owned.length > 0 ? owned : allowLocked ? all : [];

    if (__DEV__) console.log("[courses]", { total: all.length, owned: owned.length, show: items.length });

    return { items, total: all.length, owned: owned.length };
  } catch (error) {
    if (__DEV__)
      console.log("[listMyCourses error]", String(error?.code || error?.message || error));
    return { items: [], total: 0, owned: 0 };
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
