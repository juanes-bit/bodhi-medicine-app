import { wpGet, wpPost, ensureNonce } from "./wpClient";

const OWNED = new Set(["owned", "member", "free", "owned_by_product"]);
const asOwned = (value) => OWNED.has(String(value ?? "").toLowerCase());

function extractCoverFromYoast(yoast) {
  try {
    return typeof yoast?.og_image?.[0]?.url === "string" ? yoast.og_image[0].url : null;
  } catch {
    return null;
  }
}

async function fetchWPPostMetaById(id) {
  if (!id) return null;
  const fields = "_fields=id,title,excerpt,yoast_head_json,featured_media";
  const candidates = [
    `/wp-json/wp/v2/courses/${id}?${fields}`,
    `/wp-json/wp/v2/course/${id}?${fields}`,
    `/wp-json/wp/v2/posts/${id}?${fields}`,
  ];
  for (const path of candidates) {
    try {
      const meta = await wpGet(path);
      if (meta?.id === id) return meta;
    } catch {
      /* ignore */
    }
  }
  return null;
}

const plain = (text) =>
  typeof text === "string" ? text.replace(/<[^>]+>/g, "").trim() : "";

export function adaptCourseCard(course = {}) {
  const hasFlag = !!(
    course.is_owned ||
    course.isOwned ||
    course.owned ||
    course.access_granted ||
    course.has_access ||
    course.user_has_access ||
    asOwned(course.access) ||
    asOwned(course.access_status)
  );

  const access = hasFlag ? "owned" : "locked";

  return {
    id: course.id,
    title: course.name ?? course.title?.rendered ?? course.title ?? "",
    image: course.thumb ?? course.thumbnail ?? course.image ?? null,
    percent: Number(course.percent ?? course.progress?.percent ?? 0) || 0,
    access,
    isOwned: access === "owned",
    r: course.r ?? course.access_reason ?? null,
  };
}

async function hydrateCoursesMeta(items) {
  const metas = await Promise.all(items.map((item) => fetchWPPostMetaById(item.id)));
  return items.map((item, index) => {
    const meta = metas[index];
    const title = meta?.title?.rendered ? plain(meta.title.rendered) : item.title;
    const image =
      extractCoverFromYoast(meta?.yoast_head_json) ??
      item.image ??
      null;
    const description = meta?.excerpt?.rendered ? plain(meta.excerpt.rendered) : "";
    return { ...item, title, image, description };
  });
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

    let all = toArray(response).map(adaptCourseCard);
    if (all.length) {
      all = await hydrateCoursesMeta(all);
    }
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
