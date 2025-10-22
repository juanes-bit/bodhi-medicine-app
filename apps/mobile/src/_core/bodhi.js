import { wpGet, wpPost } from "./wpClient";

const COURSES_MODE = "union";
const PER_PAGE = 50;

function normalizeAccess(access) {
  const value = String(access || "").toLowerCase();
  return ["owned", "member", "free", "owned_by_product"].includes(value)
    ? "owned"
    : "locked";
}

export async function listMyCourses({ page = 1 } = {}) {
  const res = await wpGet(
    `/wp-json/bodhi/v1/courses?mode=${COURSES_MODE}&per_page=${PER_PAGE}&page=${page}`,
  );
  const raw = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  const items = raw.map(adaptCourseCard);

  if (__DEV__) {
    const sample = items
      .slice(0, 5)
      .map(({ id, access, isOwned, percent, _debug_access_reason }) => ({
        id,
        access,
        isOwned,
        percent,
        _debug_access_reason,
      }));
    console.log("[courses]", items.length, sample);
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

export function adaptCourseCard(course = {}) {
  const access = normalizeAccess(course.access);
  const percent = typeof course.percent === "number" ? course.percent : 0;

  return {
    id: course.id,
    title: course.title ?? course.name ?? "Curso",
    image: course.thumb ?? course.thumbnail ?? course.image ?? null,
    percent,
    access,
    isOwned: access === "owned",
    _debug_access_reason: course.access_reason ?? null,
  };
}

export default function BodhiDataModule() {
  return null;
}
