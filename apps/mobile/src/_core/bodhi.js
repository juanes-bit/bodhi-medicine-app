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

const low = (v) => String(v ?? "").toLowerCase();

const inferOwnedFromUnion = (o = {}) =>
  Boolean(
    o?.isOwned ||
      o?.is_owned ||
      o?.owned ||
      o?.access_granted ||
      o?.has_access ||
      o?.owned_by_product ||
      ["owned", "member", "free"].includes(low(o?.access)) ||
      ["owned", "member", "free"].includes(low(o?.status)) ||
      ["member", "owned"].includes(low(o?.membership)) ||
      (o?.course && typeof o.course === "object" && inferOwnedFromUnion(o.course)) ||
      (Array.isArray(o?.products) &&
        o.products.some((p) => p && p.has_access === true)),
  );

const flattenUnionItem = (x = {}) => {
  const c = x?.course && typeof x.course === "object" ? x.course : null;
  if (!c) return x;
  const base = { ...c };
  if ("owned_by_product" in x) base.owned_by_product = x.owned_by_product;
  if ("has_access" in x) base.has_access = x.has_access;
  if ("access" in x && !base.access) base.access = x.access;
  if ("products" in x && !base.products) base.products = x.products;
  return base;
};

const normalizeBasicCourse = (raw = {}) => {
  const id = pickId(raw);
  const title =
    (typeof raw?.title === "string" && raw.title) ||
    (typeof raw?.name === "string" && raw.name) ||
    (typeof raw?.post_title === "string" && raw.post_title) ||
    "";
  const image =
    (typeof raw?.image === "string" && raw.image) ||
    (typeof raw?.cover_image === "string" && raw.cover_image) ||
    (typeof raw?.featured_image === "string" && raw.featured_image) ||
    (typeof raw?.thumbnail === "string" && raw.thumbnail) ||
    null;
  const summary =
    (typeof raw?.summary === "string" && raw.summary) ||
    (typeof raw?.excerpt === "string" && raw.excerpt) ||
    (typeof raw?.description === "string" && raw.description) ||
    null;
  const isOwned = normalizeOwned(raw);
  return {
    id,
    title,
    image,
    summary,
    isOwned,
    access: isOwned ? "owned" : raw?.access ?? "locked",
    _raw: raw,
  };
};

const normalizeMyCoursesResponse = (payload = {}) => {
  const rawItems = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
    ? payload
    : [];
  const ownedCandidates = Array.isArray(payload?.itemsOwned)
    ? payload.itemsOwned
    : Array.isArray(payload?.owned)
    ? payload.owned
    : [];
  const ownedSet = new Set(
    ownedCandidates
      .map((value) => (typeof value === "object" ? pickId(value) : Number(value)))
      .filter((value) => Number.isFinite(value))
  );

  const items = rawItems.map((raw) => {
    const normalized = normalizeBasicCourse(raw);
    const isOwned = normalized.isOwned || ownedSet.has(normalized.id);
    return { ...normalized, isOwned, access: isOwned ? "owned" : normalized.access };
  });

  const itemsOwned = items.filter((item) => item.isOwned);
  const total = Number.isFinite(payload?.total) ? payload.total : items.length;
  const owned = Number.isFinite(payload?.owned)
    ? payload.owned
    : itemsOwned.length;

  return { items, itemsOwned, total, owned };
};

async function fetchOwnedCourseIds(uid) {
  const owned = new Set();
  if (!uid) {
    return owned;
  }
  try {
    const products = await wpGet(`/wp-json/tva/v1/customers/${uid}/products`);
    const list = Array.isArray(products) ? products : [];
    for (const product of list) {
      const pid = pickId(product);
      if (!pid) continue;
      try {
        const courses = await wpGet(`/wp-json/tva/v1/products/${pid}/courses`);
        const courseArr = Array.isArray(courses) ? courses : [];
        for (const course of courseArr) {
          const cid = pickId(course);
          if (cid) owned.add(cid);
        }
      } catch {
        // ignore individual product failures
      }
    }
  } catch {
    // ignore customer fetch failure
  }
  return owned;
}

async function fetchPublicCoursesMap() {
  const map = new Map();
  try {
    const response = await wpGet("/wp-json/tva-public/v1/courses");
    const list = Array.isArray(response) ? response : [];
    for (const entry of list) {
      const id = pickId(entry);
      if (!id) continue;
      const cleanText = (value) =>
        typeof value === "string"
          ? value.replace(/<[^>]+>/g, "").trim()
          : null;
      map.set(id, {
        title: typeof entry?.name === "string" ? entry.name : "",
        image:
          typeof entry?.cover_image === "string" && entry.cover_image.trim()
            ? entry.cover_image.trim()
            : null,
        summary:
          cleanText(entry?.description) ||
          cleanText(entry?.excerpt) ||
          cleanText(entry?.text) ||
          null,
      });
    }
  } catch {
    // ignore
  }
  return map;
}

export async function me() {
  // cookie-only endpoint
  return wpGet(`${MOBILE_NS}/me`, { nonce: false });
}

export async function listMyCourses() {
  try {
    try {
      const mobilePayload = await wpGet("/wp-json/bodhi-mobile/v1/my-courses", {
        nonce: false,
      });
      const normalizedMobile = normalizeMyCoursesResponse(mobilePayload);
      if (normalizedMobile.items.length || normalizedMobile.itemsOwned.length) {
        return normalizedMobile;
      }
    } catch {
      // fall through to union fallback
    }

    const meData = await me().catch(() => null);
    const userId = pickId(meData) ?? meData?.id ?? null;

    const [unionRes, ownedIds, publicMap] = await Promise.all([
      wpGet(`${COURSES_URL}&_=${Date.now()}`).catch(() => null),
      fetchOwnedCourseIds(userId),
      fetchPublicCoursesMap(),
    ]);

    const raws = Array.isArray(unionRes)
      ? unionRes
      : Array.isArray(unionRes?.items)
      ? unionRes.items
      : [];

    const items = raws.map((raw = {}) => {
      const flattened = flattenUnionItem(raw);
      const id = pickId(flattened);
      const publicCourse = id ? publicMap.get(id) : null;

      const title =
        (typeof flattened?.title === "string" && flattened.title) ||
        (typeof flattened?.name === "string" && flattened.name) ||
        (typeof flattened?.post_title === "string" && flattened.post_title) ||
        (publicCourse?.title ?? "");

      const imageCandidate =
        (typeof flattened?.cover_image === "string" && flattened.cover_image) ||
        (typeof flattened?.image === "string" && flattened.image) ||
        (typeof flattened?.thumbnail === "string" && flattened.thumbnail) ||
        (typeof flattened?.featured_image === "string" &&
          flattened.featured_image) ||
        publicCourse?.image ||
        null;

      const sanitize = (value) =>
        typeof value === "string"
          ? value.replace(/<[^>]+>/g, "").trim() || null
          : null;

      const summary =
        sanitize(flattened?.summary) ||
        sanitize(flattened?.excerpt) ||
        sanitize(flattened?.description) ||
        sanitize(flattened?.text) ||
        sanitize(flattened?.post_excerpt) ||
        sanitize(flattened?.short_description) ||
        publicCourse?.summary ||
        null;

      const isOwned =
        (id !== null && ownedIds.has(id)) || inferOwnedFromUnion(flattened);

      return {
        id,
        title: title || "",
        image: imageCandidate || null,
        summary,
        isOwned,
        access: isOwned ? "owned" : "locked",
        _raw: flattened,
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
