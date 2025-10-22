import { wpGet, wpPost } from "./wpClient";

const COURSES_MODE = "union";
const PER_PAGE = 50;

function normalizeAccess(access) {
  const value = typeof access === "string" ? access.toLowerCase() : "";
  if (["owned", "member", "free", "owned_by_product"].includes(value)) {
    return "owned";
  }
  return "locked";
}

// Lista de cursos del usuario (owned). Estructura: array de cards adaptadas
export async function listMyCourses({ page = 1 } = {}) {
  const query = `?mode=${COURSES_MODE}&per_page=${PER_PAGE}&page=${page}`;
  const res = await wpGet(`/wp-json/bodhi/v1/courses${query}`);
  const rawItems = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  const items = rawItems.map((item, index) => adaptCourseCard(item, index));

  if (__DEV__) {
    const sample = items.slice(0, 5).map(({ id, access, _debug_access_reason }) => ({ id, access, _debug_access_reason }));
    console.log('[courses]', items.length, sample);
  }

  return { items };
}

// Detalle normalizado: incluye módulos y lecciones
export async function getCourse(courseId) {
  return await wpGet(`/wp-json/bodhi/v1/courses/${courseId}`);
}

// Progreso por curso
export async function getProgress(courseId) {
  return await wpGet(`/wp-json/bodhi/v1/progress?course_id=${courseId}`);
}

// Marcar lección completada
export async function setProgress(courseId, lessonId, done = true) {
  return await wpPost("/wp-json/bodhi/v1/progress", {
    course_id: courseId,
    lesson_id: lessonId,
    completed: !!done,
  });
}

// (Opcional) Datos de sesión/usuario
export async function me() {
  return await wpGet("/wp-json/bodhi/v1/me");
}

function stripHtml(value) {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]+>/g, "").trim();
}

function resolveTitle(raw) {
  const candidates = [
    raw?.name,
    raw?.title,
    raw?.post_title,
    raw?.course?.title,
    raw?.course?.name,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") return stripHtml(candidate);
    if (typeof candidate === "object") {
      if (typeof candidate.rendered === "string")
        return stripHtml(candidate.rendered);
      if (typeof candidate.value === "string")
        return stripHtml(candidate.value);
    }
  }
  return "Curso";
}

function resolveSummary(raw, fallback) {
  const candidates = [
    raw?.summary,
    raw?.excerpt,
    raw?.description,
    raw?.course?.description,
    raw?.course?.excerpt,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") {
      const stripped = stripHtml(candidate);
      if (stripped) return stripped;
    }
    if (typeof candidate === "object") {
      if (typeof candidate.rendered === "string") {
        const stripped = stripHtml(candidate.rendered);
        if (stripped) return stripped;
      }
      if (typeof candidate.value === "string") {
        const stripped = stripHtml(candidate.value);
        if (stripped) return stripped;
      }
    }
  }
  return fallback;
}

function resolveImage(raw) {
  const candidates = [
    raw?.cover_image,
    raw?.featured_image,
    raw?.image,
    raw?.thumbnail,
    raw?.thumb,
    raw?.course?.cover?.url,
    raw?.course?.image,
  ];
  for (const candidate of candidates) {
    if (!candidate) continue;
    if (typeof candidate === "string") return { uri: candidate };
    if (candidate?.url) return { uri: candidate.url };
    if (candidate?.src) return { uri: candidate.src };
    if (candidate?.source_url) return { uri: candidate.source_url };
  }
  return require("../../assets/images/new_course/new_course_4.png");
}

function resolveRating(raw) {
  const candidates = [
    raw?.rating,
    raw?.average_rating,
    raw?.reviews_average,
    raw?.course?.rating,
  ];
  for (const candidate of candidates) {
    const num = Number(candidate);
    if (Number.isFinite(num)) return num.toFixed(1);
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return "5.0";
}

function resolveReviews(raw) {
  const candidates = [
    raw?.reviews_count,
    raw?.rating_count,
    raw?.course?.reviews_count,
  ];
  for (const candidate of candidates) {
    const num = Number(candidate);
    if (Number.isFinite(num)) return String(num);
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return "0";
}

function resolvePrice(raw) {
  const candidates = [
    raw?.price,
    raw?.regular_price,
    raw?.course_price,
    raw?.amount,
    raw?.sale_price,
  ];
  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined) continue;
    if (typeof candidate === "number") return candidate.toFixed(0);
    if (typeof candidate === "string" && candidate.trim()) return candidate;
  }
  return "";
}

// Adaptador muy simple a la UI de cards (ajusta si tu card espera otras props)
export function adaptCourseCard(c = {}, fallbackIndex = 0) {
  const outer = c ?? {};
  const rawSource = outer.raw ?? outer.course ?? outer;
  const courseId =
    Number(
      outer.id ??
        outer.ID ??
        outer.course_id ??
        rawSource?.id ??
        rawSource?.ID ??
        rawSource?.course_id ??
        rawSource?.product_id ??
        rawSource?.wp_post_id ??
        rawSource?.post_id ??
        fallbackIndex
    ) || fallbackIndex;

  const title = resolveTitle(rawSource);
  const summary = resolveSummary(rawSource, title);
  const image = resolveImage({ ...rawSource, ...outer });
  const rating = resolveRating(rawSource);
  const reviews = resolveReviews(rawSource);
  const price = resolvePrice(rawSource);
  const lessonsCount = Array.isArray(rawSource?.lessons)
    ? rawSource.lessons.length
    : rawSource?.count_lessons ?? outer?.count_lessons ?? 0;

  const percentCandidate =
    outer.percent ??
    outer.progress ??
    rawSource?.percent ??
    rawSource?.progress ??
    0;
  const percent = typeof percentCandidate === 'number' ? percentCandidate : Number(percentCandidate) || 0;

  const access = normalizeAccess(outer.access ?? rawSource?.access);
  const isOwned = access === 'owned';
  const debugReason = outer.access_reason ?? rawSource?.access_reason ?? null;

  return {
    id: courseId,
    courseId,
    title,
    courseCategory: title,
    courseName: summary,
    slug: rawSource?.slug ?? rawSource?.permalink_slug ?? outer?.slug ?? null,
    image,
    courseRating: rating,
    courseNumberOfRating: reviews,
    coursePrice: price,
    lessonsCount,
    percent,
    access,
    isOwned,
    _debug_access_reason: debugReason,
    raw: rawSource,
  };
}

export default function BodhiDataModule() {
  return null;
}
