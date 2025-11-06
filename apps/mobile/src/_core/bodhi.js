import { wpGet, wpPost } from "./wpClient";
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

const MOBILE_NS = "/wp-json/bodhi-mobile/v1";

const MOBILE_COURSES_URL = "/wp-json/bodhi-mobile/v1/my-courses";
const NONCE_ERROR_CODE = "rest_cookie_invalid_nonce";

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

const isNonceError = (error) => {
  if (!error || error.status !== 403) return false;
  const message = String(error.message ?? "");
  if (!message) return false;
  if (message.includes(NONCE_ERROR_CODE)) return true;
  try {
    const parsed = JSON.parse(message);
    if (parsed && typeof parsed === "object") {
      if (parsed.code === NONCE_ERROR_CODE) return true;
      const parsedMessage =
        typeof parsed.message === "string" ? parsed.message : "";
      return parsedMessage.includes(NONCE_ERROR_CODE);
    }
  } catch {
    // ignore JSON parse issues
  }
  return false;
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

const pickId = (input = {}) => {
  if (!input) return null;
  if (typeof input === "object" && input.course) {
    const nested = pickId(input.course);
    if (nested != null) return nested;
  }

  const raw =
    input?.id ??
    input?.ID ??
    input?.course_id ??
    input?.wp_post_id ??
    input?.post_id ??
    input?.courseId ??
    input?.wpPostId ??
    input;

  const numeric = Number.parseInt(String(raw ?? ""), 10);
  if (Number.isFinite(numeric)) {
    return numeric;
  }

  return null;
};

const collectOwnedIdsFromPayload = (payload = {}) => {
  const base = payload?.data && typeof payload.data === "object" ? payload.data : null;
  const candidates = [
    payload?.itemsOwned,
    payload?.items_owned,
    payload?.ownedIds,
    payload?.owned_ids,
    payload?.owned_list,
    payload?.ownedItems,
    payload?.owned,
    base?.itemsOwned,
    base?.items_owned,
    base?.ownedIds,
    base?.owned_ids,
    base?.owned_list,
    base?.ownedItems,
    base?.owned,
  ];

  const collected = new Set();
  for (const candidate of candidates) {
    const list = Array.isArray(candidate) ? candidate : [];
    for (const entry of list) {
      if (entry == null) continue;

      if (typeof entry === "object") {
        const id = pickId(entry);
        if (typeof id === "number" && Number.isFinite(id)) {
          collected.add(id);
          continue;
        }
      }

      const numeric = Number(entry);
      if (Number.isFinite(numeric)) {
        collected.add(numeric);
      }
    }
  }

  return collected;
};

const coerceNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export function normalizeCourse(item = {}, ownedSet = new Set()) {
  const id = coerceNumber(
    item?.id ?? item?.courseId ?? item?.course_id ?? item?.wp_post_id,
    0,
  );
  const accessRaw = typeof item?.access === "string" ? item.access : null;
  const accessNormalized = accessRaw ? accessRaw.toLowerCase() : null;

  const ownedFlag =
    item?.is_owned ??
    item?.isOwned ??
    item?.owned ??
    item?.access_granted ??
    item?.has_access ??
    null;

  const explicitOwned =
    typeof ownedFlag === "string"
      ? ownedFlag.toLowerCase() === "true"
      : Boolean(ownedFlag);

  const isOwned =
    explicitOwned ||
    accessNormalized === "owned" ||
    ownedSet.has(id) ||
    normalizeOwned(item);

  const title = pickString(item?.title, item?.name, item?.course_name, item?.post_title);
  const image = pickImage(item?.image, item?.featured_image, item?.thumbnail, item?.cover);
  const excerpt =
    sanitizeContent(item?.summary) ||
    sanitizeContent(item?.excerpt) ||
    sanitizeContent(item?.description) ||
    sanitizeContent(item?.short_description) ||
    "";

  return {
    id,
    courseId: id,
    title,
    image: image ?? null,
    excerpt,
    summary: excerpt,
    percent: coerceNumber(item?.percent ?? item?.progress?.pct ?? item?.progress, 0),
    modules_count: coerceNumber(item?.modules_count ?? item?.modules?.length, 0),
    lessons_count: coerceNumber(item?.lessons_count ?? item?.lessons?.length, 0),
    is_owned: isOwned,
    isOwned,
    access: accessRaw ?? (isOwned ? "owned" : "locked"),
    raw: item,
  };
}

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
    const profile = await wpGet(`${MOBILE_NS}/me`);
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
  let payload;

  try {
    payload = await wpGet(MOBILE_COURSES_URL);
  } catch (error) {
    if (isNonceError(error)) {
      const sessionError = new Error(
        "Tu sesión expiró. Por favor vuelve a iniciar sesión.",
      );
      sessionError.code = "session_expired";
      sessionError.status = 401;
      throw sessionError;
    }
    throw error;
  }

  const source = payload?.data ?? payload ?? {};
  const rawItems = Array.isArray(source?.items)
    ? source.items
    : Array.isArray(source?.list)
    ? source.list
    : Array.isArray(payload)
    ? payload
    : [];

  if (!rawItems.length) {
    const error = new Error("SCHEMA_INVALID");
    error.code = "schema_invalid";
    error.status = 500;
    throw error;
  }

  const ownedSet = collectOwnedIdsFromPayload(payload);
  if (!ownedSet.size) {
    for (const raw of rawItems) {
      const candidateId = pickId(raw);
      if (candidateId != null && normalizeOwned(raw)) {
        ownedSet.add(candidateId);
      }
      if (
        raw &&
        typeof raw === "object" &&
        raw.course &&
        typeof raw.course === "object"
      ) {
        const nestedId = pickId(raw.course);
        if (nestedId != null && normalizeOwned(raw.course)) {
          ownedSet.add(nestedId);
        }
      }
    }
  }

  const items = rawItems.map((item) => {
    const course =
      item &&
      typeof item === "object" &&
      item.course &&
      typeof item.course === "object"
        ? { ...item.course, ...item }
        : item;
    return normalizeCourse(course, ownedSet);
  });

  const ownedItems = items.filter((course) => course.isOwned);
  const result = {
    items,
    itemsOwned: ownedItems,
    total: Number.isFinite(source.total) ? source.total : items.length,
    owned: Number.isFinite(source.owned) ? source.owned : ownedItems.length,
    source: MOBILE_COURSES_URL,
    error: null,
    errorStatus: null,
  };

  const enhanced = await enhanceCoursesMetadata(result);
  logTiming("courses.list", Date.now() - started, {
    source: MOBILE_COURSES_URL,
    items: enhanced.items.length,
    owned: enhanced.itemsOwned.length,
  });

  return enhanced;
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

export async function getMobileCourse(courseId) {
  return wpGet(`/wp-json/bodhi-mobile/v1/course/${courseId}`);
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
