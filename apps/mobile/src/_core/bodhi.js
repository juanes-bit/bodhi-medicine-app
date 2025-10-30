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
  { url: "/wp-json/bodhi-mobile/v1/my-courses", options: { nonce: false }, flatten: false },
  { url: "/wp-json/bodhi/v1/my-courses", flatten: false },
  { url: "/wp-json/bodhi/v1/courses?mode=union", flatten: true },
];

const UNION_URL = "/wp-json/bodhi/v1/courses?mode=union";

const pickId = (o = {}) => {
  const candidate =
    o?.id ??
    o?.ID ??
    o?.course_id ??
    o?.wp_post_id ??
    o?.post_id ??
    o?.courseId;
  return Number.isFinite(+candidate) ? +candidate : null;
};

const extractString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value.rendered === "string") return value.rendered;
    if (Array.isArray(value)) {
      for (const entry of value) {
        const resolved = extractString(entry);
        if (resolved) return resolved;
      }
    }
  }
  return "";
};

const extractImage = (value) => {
  if (!value) return null;
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "object") {
    const direct = value.url || value.src || value.source || value.source_url;
    if (typeof direct === "string" && direct.trim()) return direct.trim();
    const sizes = value.sizes || value.media_details?.sizes;
    if (sizes && typeof sizes === "object") {
      for (const key of ["large", "full", "medium", "thumbnail"]) {
        const candidate = sizes[key];
        const resolved = extractImage(candidate);
        if (resolved) return resolved;
      }
    }
  }
  return null;
};

const sanitizeContent = (value) => {
  const raw = extractString(value);
  if (!raw) return null;
  const cleaned = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || null;
};

const pickString = (...values) => {
  for (const value of values) {
    const resolved = extractString(value);
    if (resolved.trim()) return resolved.trim();
  }
  return "";
};

const pickImage = (...values) => {
  for (const value of values) {
    const resolved = extractImage(value);
    if (resolved) return resolved;
  }
  return null;
};

const flattenCourseEntry = (raw = {}) => {
  const inner = raw?.course && typeof raw.course === "object" ? raw.course : null;
  if (!inner) return raw;
  const flattened = { ...inner };
  if ("owned_by_product" in raw) flattened.owned_by_product = raw.owned_by_product;
  if ("has_access" in raw) flattened.has_access = raw.has_access;
  if ("access" in raw && !flattened.access) flattened.access = raw.access;
  if ("products" in raw && !flattened.products) flattened.products = raw.products;
  return flattened;
};

const resolveAccess = (value) => {
  const normalized = String(value ?? "").toLowerCase();
  return OWNED_ACCESS.has(normalized) ? "owned" : normalized || "locked";
};

const collectOwnedIds = (payload = {}) => {
  const source = payload?.data ?? payload;
  const candidates = [
    source?.itemsOwned,
    source?.ownedIds,
    source?.owned_ids,
    source?.owned_list,
    source?.owned,
  ];
  return new Set(
    candidates
      .flatMap((value) => (Array.isArray(value) ? value : []))
      .map((value) => (typeof value === "object" ? pickId(value) : Number(value)))
      .filter((value) => Number.isFinite(value))
  );
};

const normalizeCourseEntry = (raw, ownedSet = new Set(), { flatten = false } = {}) => {
  const course = flatten ? flattenCourseEntry(raw) : raw;
  const id = pickId(course);
  const title = pickString(course?.title, course?.name, course?.post_title);
  const image = pickImage(
    course?.image,
    course?.cover_image,
    course?.featured_image,
    course?.thumbnail,
  );
  const summary =
    sanitizeContent(course?.summary) ||
    sanitizeContent(course?.excerpt) ||
    sanitizeContent(course?.description) ||
    sanitizeContent(course?.text) ||
    sanitizeContent(course?.post_excerpt) ||
    sanitizeContent(course?.short_description) ||
    null;
  const isOwned = ownedSet.has(id) || normalizeOwned(course);
  const access = isOwned ? "owned" : resolveAccess(course?.access);
  return {
    id,
    title,
    image,
    summary,
    isOwned,
    access,
    _raw: course,
  };
};

const normalizeCoursesPayload = (payload = {}, { flatten = false } = {}) => {
  const source = payload?.data ?? payload;
  const rawItems = Array.isArray(source?.items)
    ? source.items
    : Array.isArray(source)
    ? source
    : [];
  const ownedSet = collectOwnedIds(source);
  const items = rawItems.map((raw) =>
    normalizeCourseEntry(raw, ownedSet, { flatten }),
  );
  const itemsOwned = items.filter((course) => course.isOwned);
  const total = Number.isFinite(source?.total) ? source.total : items.length;
  const owned = Number.isFinite(source?.owned)
    ? source.owned
    : itemsOwned.length;
  return { items, itemsOwned, total, owned };
};

const fetchOwnedCourseIds = async (userId) => {
  const owned = new Set();
  if (!Number.isFinite(userId)) {
    return owned;
  }
  try {
    const productsPayload = await wpGet(`/wp-json/tva/v1/customers/${userId}/products`);
    const productsSource = productsPayload?.data ?? productsPayload;
    const products = Array.isArray(productsSource?.items)
      ? productsSource.items
      : Array.isArray(productsSource)
      ? productsSource
      : [];

    for (const product of products) {
      const productId = pickId(product);
      if (!productId) continue;
      try {
        const coursesPayload = await wpGet(`/wp-json/tva/v1/products/${productId}/courses`);
        const coursesSource = coursesPayload?.data ?? coursesPayload;
        const courses = Array.isArray(coursesSource?.items)
          ? coursesSource.items
          : Array.isArray(coursesSource)
          ? coursesSource
          : [];
        for (const course of courses) {
          const courseId = pickId(course);
          if (courseId) {
            owned.add(courseId);
          }
        }
      } catch {
        // ignore individual course failures
      }
    }
  } catch {
    // ignore customer fetch failure
  }
  return owned;
};

const fetchPublicCoursesMap = async () => {
  const map = new Map();
  try {
    const payload = await wpGet("/wp-json/tva-public/v1/courses");
    const source = payload?.data ?? payload;
    const list = Array.isArray(source?.items)
      ? source.items
      : Array.isArray(source)
      ? source
      : [];

    for (const entry of list) {
      const id = pickId(entry);
      if (!id) continue;
      map.set(id, {
        title: pickString(entry?.title, entry?.name),
        image: pickImage(entry?.cover_image, entry?.image, entry?.thumb),
        summary:
          sanitizeContent(entry?.summary) ||
          sanitizeContent(entry?.description) ||
          sanitizeContent(entry?.excerpt) ||
          null,
      });
    }
  } catch {
    // ignore
  }
  return map;
};

const buildUnionFallback = async () => {
  try {
    const unionPayload = await wpGet(`${UNION_URL}&_=${Date.now()}`).catch(() => null);
    const source = unionPayload?.data ?? unionPayload ?? {};
    const rawItems = Array.isArray(source?.items)
      ? source.items
      : Array.isArray(source)
      ? source
      : [];

    const ownedIds = new Set(
      rawItems
        .filter((entry) => normalizeOwned(entry))
        .map((entry) => pickId(entry))
        .filter((id) => Number.isFinite(id)),
    );

    const publicMap = await fetchPublicCoursesMap();

    const ownedSet = collectOwnedIds(source);
    ownedIds.forEach((id) => ownedSet.add(id));

    const items = rawItems.map((raw = {}) => {
      const course = flattenCourseEntry(raw);
      const id = pickId(course);
      const publicMeta = id ? publicMap.get(id) : null;
      const title = pickString(
        course?.title,
        course?.name,
        course?.post_title,
        publicMeta?.title,
      );
      const image =
        pickImage(
          course?.image,
          course?.cover_image,
          course?.featured_image,
          course?.thumbnail,
        ) || publicMeta?.image || null;
      const summary =
        sanitizeContent(course?.summary) ||
        sanitizeContent(course?.excerpt) ||
        sanitizeContent(course?.description) ||
        sanitizeContent(course?.text) ||
        sanitizeContent(course?.post_excerpt) ||
        sanitizeContent(course?.short_description) ||
        publicMeta?.summary ||
        null;
      const isOwned = ownedSet.has(id) || normalizeOwned(course);
      const access = isOwned ? "owned" : resolveAccess(course?.access);
      return { id, title, image, summary, isOwned, access, _raw: course };
    });

    const itemsOwned = items.filter((item) => item.isOwned);
    const total = Number.isFinite(source?.total) ? source.total : items.length;
    const owned = Number.isFinite(source?.owned)
      ? source.owned
      : itemsOwned.length;
    return { items, itemsOwned, total, owned };
  } catch (error) {
    console.log("[listMyCourses union fallback]", error?.message || error);
    return { items: [], itemsOwned: [], total: 0, owned: 0 };
  }
};

export async function me() {
  // cookie-only endpoint
  return wpGet(`${MOBILE_NS}/me`, { nonce: false });
}

export async function listMyCourses() {
  try {
    let fallbackNormalized = null;

    for (const source of COURSE_SOURCES) {
      try {
        const payload = await wpGet(source.url, source.options || {});
        const normalized = normalizeCoursesPayload(payload, {
          flatten: Boolean(source.flatten),
        });

        if (normalized.items.length || normalized.itemsOwned.length) {
          if (normalized.itemsOwned.length) {
            return normalized;
          }
          fallbackNormalized = fallbackNormalized ?? normalized;
        }
      } catch {
        // try next endpoint
      }
    }

    const unionFallback = await buildUnionFallback();
    if (unionFallback.itemsOwned.length) {
      return unionFallback;
    }
    if (unionFallback.items.length) {
      fallbackNormalized = unionFallback;
    }

    return fallbackNormalized ?? { items: [], itemsOwned: [], total: 0, owned: 0 };
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
