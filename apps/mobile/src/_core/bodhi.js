import { wpGet, wpPost } from "./wpClient";

// Lista de cursos del usuario (owned). Estructura: { items: [...] }
export async function listMyCourses() {
  const data = await wpGet("/wp-json/bodhi/v1/courses");
  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data)
      ? data
      : [];
  return items;
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
export function adaptCourseCard(c = {}, index = 0) {
  const courseId =
    Number(
      c?.id ??
        c?.ID ??
        c?.course_id ??
        c?.product_id ??
        c?.wp_post_id ??
        c?.post_id ??
        index
    ) || index;

  const title = resolveTitle(c);
  const summary = resolveSummary(c, title);
  const image = resolveImage(c);
  const rating = resolveRating(c);
  const reviews = resolveReviews(c);
  const price = resolvePrice(c);
  const lessonsCount = Array.isArray(c?.lessons) ? c.lessons.length : (c?.count_lessons ?? 0);

  return {
    courseId,
    image,
    courseName: summary,
    courseCategory: title,
    courseRating: rating,
    courseNumberOfRating: reviews,
    coursePrice: price,
    lessonsCount,
    raw: c,
  };
}

export default function BodhiDataModule() {
  return null;
}
