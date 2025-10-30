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
const COURSE_SOURCES = [
  { url: "/wp-json/bodhi-mobile/v1/my-courses", options: { nonce: false } },
  { url: "/wp-json/bodhi/v1/my-courses" },
  { url: "/wp-json/bodhi/v1/courses?mode=union" },
];

const pickId = (o = {}) => {
  const v =
    o?.id ??
    o?.ID ??
    o?.wp_post_id ??
    o?.post_id ??
    o?.course_id ??
    o?.wp_postId ??
    o?.courseId;
  return Number.isFinite(+v) ? +v : null;
};

const lower = (value) => String(value ?? "").toLowerCase();

const flattenUnionItem = (raw = {}) => {
  const course = raw?.course && typeof raw.course === "object" ? raw.course : null;
  if (!course) return raw;
  const base = { ...course };
  if ("owned_by_product" in raw) base.owned_by_product = raw.owned_by_product;
  if ("has_access" in raw) base.has_access = raw.has_access;
  if ("access" in raw && !base.access) base.access = raw.access;
  if ("products" in raw && !base.products) base.products = raw.products;
  return base;
};

const adaptCourse = (raw = {}) => {
  const flattened = flattenUnionItem(raw);
  const id = pickId(flattened);
  const title =
    (typeof flattened?.title === "string" && flattened.title.trim()) ||
    (typeof flattened?.name === "string" && flattened.name.trim()) ||
    (typeof flattened?.post_title === "string" && flattened.post_title.trim()) ||
    "";
  const image =
    (typeof flattened?.image === "string" && flattened.image.trim()) ||
    (typeof flattened?.cover_image === "string" && flattened.cover_image.trim()) ||
    (typeof flattened?.thumbnail === "string" && flattened.thumbnail.trim()) ||
    (typeof flattened?.featured_image === "string" && flattened.featured_image.trim()) ||
    null;
  const cleanText = (value) =>
    typeof value === "string" ? value.replace(/<[^>]+>/g, "").trim() : null;
  const summary =
    cleanText(flattened?.summary) ||
    cleanText(flattened?.excerpt) ||
    cleanText(flattened?.description) ||
    cleanText(flattened?.text) ||
    cleanText(flattened?.post_excerpt) ||
    cleanText(flattened?.short_description) ||
    null;
  const isOwned = Boolean(
    flattened?.isOwned ||
      flattened?.is_owned ||
      flattened?.owned ||
      flattened?.access_granted ||
      flattened?.has_access ||
      flattened?.owned_by_product ||
      ["owned", "member", "free"].includes(lower(flattened?.access)) ||
      ["owned", "member", "free"].includes(lower(flattened?.status)) ||
      ["member", "owned"].includes(lower(flattened?.membership)) ||
      (Array.isArray(flattened?.products) &&
        flattened.products.some((p) => p && p.has_access === true)),
  );

  return {
    id,
    title,
    image,
    summary,
    isOwned,
    access: isOwned ? "owned" : "locked",
    _raw: flattened,
  };
};

const normalizeCoursesPayload = (payload = {}, fallbackOwned = []) => {
  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
    ? payload
    : [];

  const ownedCandidates = Array.isArray(payload?.itemsOwned)
    ? payload.itemsOwned
    : Array.isArray(payload?.owned_list)
    ? payload.owned_list
    : Array.isArray(payload?.ownedIds)
    ? payload.ownedIds
    : Array.isArray(payload?.owned)
    ? payload.owned
    : fallbackOwned;

  const ownedIdSet = new Set(
    ownedCandidates
      .map((value) => (typeof value === "object" ? pickId(value) : Number(value)))
      .filter((value) => Number.isFinite(value))
  );

  const items = rawItems.map((raw) => {
    const base = adaptCourse(raw);
    const owned = ownedIdSet.has(base.id) || base.isOwned;
    return {
      ...base,
      isOwned: owned,
      access: owned ? "owned" : base.access,
    };
  });

  const itemsOwned = items.filter((course) => course.isOwned);
  const total = Number.isFinite(payload?.total) ? payload.total : items.length;
  const owned = Number.isFinite(payload?.owned)
    ? payload.owned
    : itemsOwned.length;

  return { items, itemsOwned, total, owned };
};

export async function me() {
  // cookie-only endpoint
  return wpGet(`${MOBILE_NS}/me`, { nonce: false });
}

export async function listMyCourses() {
  try {
    for (const source of COURSE_SOURCES) {
      try {
        const payload = await wpGet(source.url, source.options || {});
        const normalized = normalizeCoursesPayload(payload);
        if (normalized.items.length || normalized.itemsOwned.length) {
          return normalized;
        }
      } catch {
        // try next source
      }
    }
    // final attempt: fetch union and normalize even if empty
    try {
      const unionPayload = await wpGet(
        `${COURSE_SOURCES[COURSE_SOURCES.length - 1].url}&_=${Date.now()}`,
      );
      return normalizeCoursesPayload(unionPayload);
    } catch (err) {
      console.log("[listMyCourses error]", err?.message || err);
      return { items: [], itemsOwned: [], total: 0, owned: 0 };
    }
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
