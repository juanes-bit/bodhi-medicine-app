import { wpGet, wpPost } from "./wp";
import { logTiming } from "./metrics";

const OWNED_ACCESS = new Set(["owned", "member", "free"]);
const ACCESS_REASON_OWNED = new Set([
  "thrive_flag",
  "purchased",
  "purchase",
  "granted",
  "manual",
]);

// === Normalizadores consistentes ===
export function normalizeOwned(course = {}) {
  const accessReason =
    typeof course.access_reason === "string"
      ? course.access_reason.toLowerCase()
      : "";
  const accessFlag =
    typeof course.access === "string" &&
    OWNED_ACCESS.has(course.access.toLowerCase());

  const baseOwned =
    course.isOwned ??
    course.is_owned ??
    course.owned ??
    course.access_granted ??
    course.user_has_access ??
    course.owned_by_product ??
    (accessFlag ? true : undefined);

  const reasonOwned = Boolean(
    accessReason && ACCESS_REASON_OWNED.has(accessReason),
  );

  return Boolean(baseOwned || reasonOwned);
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

const MOBILE_COURSES_URL = "/wp-json/bodhi-mobile/v1/my-courses";

const COURSE_SOURCES = [
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
    source?.items_owned,
    source?.ownedIds,
    source?.owned_ids,
    source?.owned_list,
    source?.ownedItems,
    source?.owned,
  ];
  const collected = new Set();
  for (const candidate of candidates) {
    const list = Array.isArray(candidate) ? candidate : [];
    for (const entry of list) {
      const numeric = typeof entry === "object" ? pickId(entry) : Number(entry);
      if (Number.isFinite(numeric)) {
        collected.add(numeric);
      }
      const stringId = normId(entry);
      if (stringId) {
        collected.add(stringId);
      }
    }
  }
  return collected;
};

const normId = (input = {}) => {
  const raw =
    input?.id ??
    input?.ID ??
    input?.post_id ??
    input?.wp_post_id ??
    input?.course_id ??
    input?.wp_postId ??
    input?.courseId ??
    input;
  if (raw == null) return "";
  const value = Array.isArray(raw) ? raw[0] : raw;
  return String(value ?? "").trim();
};

const normalizeMobileMyCourses = (payload = {}) => {
  const source = payload?.data ?? payload ?? {};
  const rawItems = Array.isArray(source?.items)
    ? source.items
    : Array.isArray(source?.list)
    ? source.list
    : Array.isArray(payload)
    ? payload
    : [];
  const ownedSet = collectOwnedIds(source);

  const items = rawItems.map((item) => {
    const normalized = normalizeCourseEntry(item, ownedSet, { flatten: false });
    return {
      ...normalized,
      access: normalized.isOwned
        ? "owned"
        : resolveAccess(item?.access ?? normalized.access),
    };
  });

  const itemsOwned = items.filter((entry) => entry.isOwned);

  const total = Number.isFinite(source?.total) ? source.total : items.length;
  const owned = Number.isFinite(source?.owned) ? source.owned : itemsOwned.length;

  if (!items.length && !itemsOwned.length) {
    return null;
  }

  return {
    items,
    itemsOwned,
    total,
    owned,
    source: MOBILE_COURSES_URL,
    error: null,
    errorStatus: null,
  };
};

const normalizeCourseEntry = (raw, ownedSet = new Set(), { flatten = false } = {}) => {
  const course = flatten ? flattenCourseEntry(raw) : raw;
  const id = pickId(course);
  const idString = normId(course);
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
  const percentRaw =
    course?.percent ??
    course?.progress?.pct ??
    course?.progress ??
    0;
  const percent = Number.isFinite(Number(percentRaw))
    ? Number(percentRaw)
    : 0;
  const isOwned =
    ownedSet.has(id) ||
    (idString ? ownedSet.has(idString) : false) ||
    normalizeOwned(course);
  const access = isOwned ? "owned" : resolveAccess(course?.access);
  return {
    id,
    title,
    image,
    summary,
    isOwned,
    access,
    percent,
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

const needsMetadataEnhancement = (item = {}) => {
  const title = typeof item.title === "string" ? item.title.trim() : "";
  const genericTitle = !title || /^curso\s*#\d+/i.test(title);
  const missingImage = !item.image;
  const missingSummary = !item.summary;
  return genericTitle || (missingImage && missingSummary);
};

const enhanceCoursesMetadata = async (result) => {
  if (!result?.items?.length) {
    return result;
  }

  const requiresEnhancement = result.items.some(needsMetadataEnhancement);
  if (!requiresEnhancement) {
    return result;
  }

  try {
    const publicMap = await fetchPublicCoursesMap();
    const enhancedItems = result.items.map((item) => {
      const meta = publicMap.get(item.id);
      if (!meta) return item;

      const title = typeof item.title === "string" ? item.title.trim() : "";
      const genericTitle = !title || /^curso\s*#\d+/i.test(title);

      return {
        ...item,
        title: genericTitle && meta.title ? meta.title : item.title,
        summary: item.summary ?? meta.summary ?? null,
        image: item.image ?? meta.image ?? null,
      };
    });

    const enhancedItemsOwned = enhancedItems.filter((course) => course.isOwned);
    return {
      ...result,
      items: enhancedItems,
      itemsOwned: enhancedItemsOwned,
      total: Number.isFinite(result.total) ? result.total : enhancedItems.length,
      owned: Number.isFinite(result.owned)
        ? result.owned
        : enhancedItemsOwned.length,
    };
  } catch {
    return result;
  }
};

export async function me() {
  const started = Date.now();
  try {
    const profile = await wpGet(`${MOBILE_NS}/me`, { nonce: false });
    logTiming("wp.me", Date.now() - started);
    return profile;
  } catch (error) {
    logTiming("wp.me", Date.now() - started, {
      error: String(error?.message || error),
      status: error?.status ?? null,
    });
    throw error;
  }
}

export async function listMyCourses() {
  const started = Date.now();
  let resolvedSource = MOBILE_COURSES_URL;
  let fallbackNormalized = null;
  let fallbackSource = null;
  let lastError = null;
  let lastStatus = null;

  try {
    const primaryPayload = await wpGet(MOBILE_COURSES_URL, { nonce: false });
    const normalizedMobile = normalizeMobileMyCourses(primaryPayload);
    if (normalizedMobile) {
      const enhancedMobile = await enhanceCoursesMetadata(normalizedMobile);
      logTiming("courses.list", Date.now() - started, {
        source: MOBILE_COURSES_URL,
        items: enhancedMobile.items.length,
        owned: enhancedMobile.itemsOwned.length,
      });
      return enhancedMobile;
    }
  } catch (error) {
    lastError = error;
    lastStatus = error?.status ?? lastStatus;
  }

  try {
    for (const source of COURSE_SOURCES) {
      try {
        const payload = await wpGet(source.url, source.options || {});
        const normalized = normalizeCoursesPayload(payload, {
          flatten: Boolean(source.flatten),
        });

        if (normalized.itemsOwned.length) {
          const enhanced = await enhanceCoursesMetadata(normalized);
          logTiming("courses.list", Date.now() - started, {
            source: source.url,
            items: enhanced.items.length,
            owned: enhanced.itemsOwned.length,
          });
          return {
            ...enhanced,
            source: source.url,
            error: null,
            errorStatus: null,
          };
        }

        if (
          (normalized.items.length || normalized.itemsOwned.length) &&
          !fallbackNormalized
        ) {
          fallbackNormalized = normalized;
          fallbackSource = source.url;
        }
      } catch (error) {
        lastError = error;
        lastStatus = error?.status ?? lastStatus;
      }
    }

    const unionFallback = await buildUnionFallback();
    let normalizedResult =
      fallbackNormalized ??
      unionFallback ?? { items: [], itemsOwned: [], total: 0, owned: 0 };

    if (normalizedResult === fallbackNormalized && fallbackNormalized) {
      resolvedSource = fallbackSource ?? "fallback-normalized";
    } else if (unionFallback) {
      resolvedSource = "union-fallback";
    } else {
      resolvedSource = "empty";
    }

    const enhanced = await enhanceCoursesMetadata(normalizedResult);
    logTiming("courses.list", Date.now() - started, {
      source: resolvedSource,
      items: enhanced.items.length,
      owned: enhanced.itemsOwned.length,
    });

    return {
      ...enhanced,
      source: resolvedSource,
      error: null,
      errorStatus: null,
    };
  } catch (error) {
    lastError = error ?? lastError;
    lastStatus = error?.status ?? lastStatus ?? null;
    logTiming("courses.list", Date.now() - started, {
      source: resolvedSource ?? "error",
      error: String(lastError?.message || lastError),
      status: lastStatus,
    });
    console.log("[listMyCourses error]", lastError?.message || lastError);
    return {
      items: [],
      itemsOwned: [],
      total: 0,
      owned: 0,
      source: resolvedSource ?? "error",
      error: String(lastError?.message || lastError),
      errorStatus: lastStatus,
    };
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
