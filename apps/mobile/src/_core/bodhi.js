import { wpGet, wpPost } from "./wp";

const OWNED_ACCESS = new Set(["owned", "member", "free"]);

// === Normalizadores consistentes ===
export function normalizeOwned(course = {}) {
  return Boolean(
    course.isOwned ??
      course.is_owned ??
      course.owned ??
      course.access_granted ??
      course.user_has_access ??
      course.owned_by_product ??
      (typeof course.access === "string" && OWNED_ACCESS.has(course.access)),
  );
}

export function normalizeId(c = {}) {
  const raw =
    c.id ??
    c.ID ??
    c.courseId ??
    c.course_id ??
    c.wp_post_id ??
    c.post_id ??
    c.wp_postId ??
    c.wpPostId;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) ? n : String(raw ?? "");
}

const MOBILE_NS = "/bodhi-mobile/v1";
const COURSES_URL = "/wp-json/bodhi/v1/courses?mode=union";

const pickId = (o = {}) => {
  const candidate =
    o?.id ??
    o?.ID ??
    o?.course_id ??
    o?.wp_post_id ??
    o?.post_id ??
    o?.courseId;
  const numeric = Number(candidate);
  return Number.isFinite(numeric) ? numeric : null;
};

const flattenUnionItem = (x = {}) => {
  const course = x && typeof x.course === "object" ? x.course : null;
  if (!course) return x;
  const base = { ...course };
  if ("owned_by_product" in x) base.owned_by_product = x.owned_by_product;
  if ("has_access" in x) base.has_access = x.has_access;
  if ("access" in x && !base.access) base.access = x.access;
  if ("products" in x) base.products = x.products;
  return base;
};

const inferOwned = (o = {}) => {
  const toLower = (v) => String(v ?? "").toLowerCase();
  return Boolean(
    o?.isOwned ||
      o?.is_owned ||
      o?.owned ||
      o?.access_granted ||
      o?.has_access ||
      o?.owned_by_product ||
      ["owned", "member", "free"].includes(toLower(o?.access)) ||
      (Array.isArray(o?.products) &&
        o.products.some(
          (p) =>
            p &&
            (p.has_access === true || toLower(p?.access) === "owned"),
        )),
  );
};

export async function me() {
  // cookie-only endpoint
  return wpGet(`${MOBILE_NS}/me`, { nonce: false });
}

export async function listMyCourses() {
  try {
    const res = await wpGet(`${COURSES_URL}&_ts=${Date.now()}`);
    const rawItems = Array.isArray(res)
      ? res
      : Array.isArray(res?.items)
      ? res.items
      : [];

    const items = rawItems.map((entry = {}) => {
      const flat = flattenUnionItem(entry);
      const id = pickId(flat);
      const normalizedOwned = inferOwned(flat);

      return {
        id,
        title: flat?.title ?? flat?.name ?? flat?.post_title ?? "",
        image: flat?.cover_image ?? flat?.image ?? flat?.thumbnail ?? null,
        isOwned: normalizedOwned,
        access: normalizedOwned ? "owned" : "locked",
        _raw: flat,
      };
    });

    const itemsOwned = items.filter((item) => item.isOwned);
    return { items, itemsOwned, total: items.length, owned: itemsOwned.length };
  } catch (error) {
    console.log("[listMyCourses error]", error?.message || error);
    return { items: [], itemsOwned: [], total: 0, owned: 0 };
  }
}

export function adaptCourseCard(course = {}) {
  const id = normalizeId(course);
  const isOwned = normalizeOwned(course);
  const access = course.access ?? (isOwned ? "owned" : "locked");
  return {
    id,
    title: course.title ?? course.name ?? course.post_title,
    image: course.image ?? course.cover_image,
    isOwned,
    access,
    percent: course.percent ?? course.progress?.pct ?? 0,
  };
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

export default function BodhiDataModule() {
  return null;
}
