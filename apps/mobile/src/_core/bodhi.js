import { wpGet, wpPost, wpGetStoredUserId, wpSetStoredUserId } from "./wpClient";

const OWNED = new Set(["owned", "member", "free", "owned_by_product"]);
const asOwned = (access) =>
  OWNED.has(String(access ?? "").toLowerCase()) ? "owned" : "locked";

export function adaptCourseCard(course = {}) {
  const access = asOwned(course.access ?? course.access_status);
  return {
    id: course.id,
    title: course.title ?? course.name ?? `Curso #${course.id ?? ""}`,
    image: course.thumb ?? course.thumbnail ?? course.image ?? null,
    percent: typeof course.percent === "number" ? course.percent : 0,
    access,
    isOwned: access === "owned",
    _debug_access_reason: course.access_reason ?? null,
  };
}

const parseId = (value) => {
  if (value == null) return 0;
  if (typeof value === "number") return value | 0;
  if (typeof value === "string") {
    const match = value.match(/(\d{2,})/);
    return match ? parseInt(match[1], 10) : 0;
  }
  if (typeof value === "object") {
    for (const key of ["id", "ID", "post_id", "course_id"]) {
      const parsed = parseId(value[key]);
      if (parsed) return parsed;
    }
    if (value.course) return parseId(value.course.id);
    if (value.post) return parseId(value.post.ID);
  }
  return 0;
};

async function fetchProductCourseIds(userId) {
  const productsRes = await wpGet(
    `/wp-json/tva/v1/customer/${userId}/products?context=edit`,
  );
  const products = Array.isArray(productsRes)
    ? productsRes
    : productsRes?.items ?? [];
  const productIds = [...new Set(products.map(parseId).filter(Boolean))];

  const idSet = new Set();
  const nameById = {};

  for (const productId of productIds) {
    const productCoursesRes = await wpGet(
      `/wp-json/tva/v1/products/${productId}/courses?context=edit&per_page=100`,
    );
    const productCourses = Array.isArray(productCoursesRes)
      ? productCoursesRes
      : productCoursesRes?.items ?? [];

    for (const entry of productCourses) {
      const courseId = parseId(entry);
      if (!courseId) continue;
      idSet.add(courseId);
      if (typeof entry === "object") {
        const name = entry.name || entry.title || entry.post_title;
        if (name && !nameById[courseId]) {
          nameById[courseId] = name;
        }
      }
    }
  }

  return { idSet, nameById };
}

async function getUidSafe() {
  const cached = await wpGetStoredUserId();
  if (cached) return cached;

  try {
    const wpCore = await wpGet("/wp-json/wp/v2/users/me");
    if (wpCore?.id) {
      await wpSetStoredUserId(wpCore.id);
      return wpCore.id;
    }
  } catch (_) {}

  try {
    const bodhiMe = await wpGet("/wp-json/bodhi/v1/me");
    if (bodhiMe?.id) {
      await wpSetStoredUserId(bodhiMe.id);
      return bodhiMe.id;
    }
  } catch (_) {}

  return null;
}

export async function listMyCourses({ page = 1, perPage = 50, profile = null } = {}) {
  const unionRes = await wpGet(
    `/wp-json/bodhi/v1/courses?mode=union&per_page=${perPage}&page=${page}`,
  );
  const union = Array.isArray(unionRes) ? union : unionRes?.items ?? [];

  const hasOwnedFromBackend = union.some((entry) =>
    OWNED.has(String(entry?.access ?? "").toLowerCase()),
  );

  if (hasOwnedFromBackend) {
    const items = union.map(adaptCourseCard);
    if (__DEV__) console.log("[courses union backend]", items.length);
    return { items };
  }

  const strictRes = await wpGet(
    `/wp-json/bodhi/v1/courses?mode=strict&per_page=${perPage}&page=${page}`,
  );
  const strict = Array.isArray(strictRes) ? strictRes : strictRes?.items ?? [];

  let userId = parseId(profile?.id ?? profile?.user_id ?? profile?.user ?? profile);
  if (userId) {
    await wpSetStoredUserId(userId);
  } else {
    userId = await getUidSafe();
  }

  if (!userId) {
    const items = strict.map(adaptCourseCard);
    if (__DEV__) console.log("[courses fallback:no-uid-safe]", items.length);
    return { items };
  }

  const { idSet, nameById } = await fetchProductCourseIds(userId);

  const merged = [];
  const seen = new Set();

  for (const course of strict) {
    const owned = idSet.has(course?.id);
    merged.push({
      ...course,
      access: owned ? "owned_by_product" : course.access || "locked",
      access_reason: owned ? "product_grant" : course.access_reason || "thrive_flag",
    });
    seen.add(course?.id);
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
      .slice(0, 6)
      .map(({ id, isOwned, access, _debug_access_reason }) => ({
        id,
        isOwned,
        access,
        _debug_access_reason,
      }));
    console.log("[courses fallback client]", items.length, sample);
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
