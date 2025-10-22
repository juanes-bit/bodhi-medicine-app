import { wpGet, wpPost } from "./wpClient";

const COURSES_MODE = "union";
const PER_PAGE = 50;

const parseId = (value) => {
  if (value == null) return 0;
  if (typeof value === "number") return value | 0;
  if (typeof value === "string") return parseInt(value.replace(/[^\d]/g, ""), 10) || 0;
  if (typeof value === "object") {
    for (const key of ["id", "ID", "post_id", "course_id"]) {
      if (value[key] != null) return parseId(value[key]);
    }
    if (value.course?.id) return parseId(value.course.id);
    if (value.post?.ID) return parseId(value.post.ID);
  }
  return 0;
};

const normAccess = (access) =>
  ["owned", "member", "free", "owned_by_product"].includes(String(access || "")?.toLowerCase())
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

async function fetchProductCourseIds(userId) {
  const productsRes = await wpGet(`/wp-json/tva/v1/customer/${userId}/products?context=edit`);
  const productIds = (Array.isArray(productsRes) ? productsRes : productsRes?.items ?? [])
    .map(parseId)
    .filter(Boolean);

  const uniqueProducts = [...new Set(productIds)];
  const idSet = new Set();
  const nameById = {};

  await Promise.all(
    uniqueProducts.map(async (productId) => {
      const prodCourses = await wpGet(
        `/wp-json/tva/v1/products/${productId}/courses?context=edit&per_page=100`,
      );
      const entries = Array.isArray(prodCourses) ? prodCourses : prodCourses?.items ?? [];
      for (const entry of entries) {
        const courseId = parseId(entry);
        if (!courseId) continue;
        idSet.add(courseId);
        if (typeof entry === "object") {
          const courseName = entry.name || entry.title || entry.post_title;
          if (courseName && !nameById[courseId]) {
            nameById[courseId] = courseName;
          }
        }
      }
    }),
  );

  return { idSet, nameById };
}

export async function listMyCourses({ page = 1 } = {}) {
  const unionRes = await wpGet(
    `/wp-json/bodhi/v1/courses?mode=${COURSES_MODE}&per_page=${PER_PAGE}&page=${page}`,
  );

  if (unionRes && typeof unionRes === "object" && unionRes.code && unionRes.data?.status >= 400) {
    console.log("[courses error]", unionRes.code, unionRes.data?.status, unionRes.message);
    return { items: [] };
  }

  const unionRaw = Array.isArray(unionRes) ? unionRes : unionRes?.items ?? [];
  const hasOwnedFromBackend = unionRaw.some((item) => {
    const access = String(item?.access || "").toLowerCase();
    return access === "owned" || access === "owned_by_product";
  });

  if (hasOwnedFromBackend) {
    const items = unionRaw.map(adaptCourseCard);
    if (__DEV__) console.log("[courses backend union]", items.length);
    return { items };
  }

  const strictRes = await wpGet(
    `/wp-json/bodhi/v1/courses?mode=strict&per_page=${PER_PAGE}&page=${page}`,
  );
  const strictRaw = Array.isArray(strictRes) ? strictRes : strictRes?.items ?? [];

  const me = await wpGet("/wp-json/bodhi/v1/me");
  const userId = me?.id;

  if (!userId) {
    const items = strictRaw.map(adaptCourseCard);
    if (__DEV__) console.log("[courses fallback: no uid]", items.length);
    return { items };
  }

  const { idSet, nameById } = await fetchProductCourseIds(userId);

  const merged = [];
  const seen = new Set();

  for (const course of strictRaw) {
    const owned = idSet.has(course.id);
    merged.push({
      ...course,
      access: owned ? "owned_by_product" : course.access || "locked",
      access_reason: owned ? "product_grant" : course.access_reason ?? "thrive_flag",
    });
    seen.add(course.id);
  }

  idSet.forEach((courseId) => {
    if (seen.has(courseId)) return;
    merged.push({
      id: courseId,
      title: nameById[courseId] || `Curso #${courseId}`,
      thumb: null,
      status: "publish",
      access: "owned_by_product",
      access_reason: "product_grant",
    });
  });

  const items = merged.map(adaptCourseCard);
  if (__DEV__) {
    const sample = items
      .slice(0, 5)
      .map(({ id, isOwned, _debug_access_reason }) => ({ id, isOwned, _debug_access_reason }));
    console.log("[courses fallback client-union]", items.length, sample);
  }

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
