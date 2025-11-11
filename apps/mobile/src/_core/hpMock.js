import AsyncStorage from '@react-native-async-storage/async-storage';
import userCourses from '../_fixtures/hp/user-courses.sample.json';
import course234 from '../_fixtures/hp/course-234-detail.sample.json';
import {
  adaptHpCourseDetail,
  adaptHpUserCourses,
  hpParsePercent,
} from './hpAdapters';
import { getHpUserId } from './hpConfig';

const COURSE_FIXTURES = {
  '234': course234,
};

const DEFAULT_USER_ID =
  (userCourses?.data && userCourses.data.user_id != null
    ? String(userCourses.data.user_id)
    : null) || 'hp-mock';

const K_COMPLETED = (uid) => `hp_mock_completed:${uid}`;

const clone = (value) => JSON.parse(JSON.stringify(value));

const safeJsonParse = (raw, fallback = {}) => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

const createCourseNotFoundError = () => {
  const error = new Error('lesson_not_found');
  error.status = 404;
  error.code = 'course_not_found';
  return error;
};

const normalizeLessonId = (lesson) => {
  if (!lesson) return null;
  const raw =
    lesson.id ?? lesson.lesson_id ?? lesson.post_id ?? lesson.ID ?? lesson.slug;
  if (raw == null) return null;
  const numeric = Number(raw);
  if (Number.isFinite(numeric)) return String(numeric);
  return String(raw);
};

const resolveContainer = (json) =>
  json?.data && typeof json.data === 'object' ? json.data : json;

const gatherLessons = (container) => {
  const modules = Array.isArray(container?.modules) ? container.modules : [];
  return modules.flatMap((module) =>
    Array.isArray(module?.lessons) ? module.lessons : [],
  );
};

const applyCompletionFromMap = (container, map) => {
  const lessons = gatherLessons(container);
  lessons.forEach((lesson) => {
    const key = normalizeLessonId(lesson);
    if (!key) return;
    if (map[key]) {
      lesson.completed = true;
      lesson.done = true;
    }
  });
};

const computeProgressSnapshot = (container) => {
  const lessons = gatherLessons(container);
  const total = lessons.length;
  const completed = lessons.filter(
    (lesson) => lesson.completed || lesson.done,
  ).length;
  const percentage = total ? Math.round((completed / total) * 100) : 0;
  const progressMap = lessons.reduce((acc, lesson) => {
    const key = normalizeLessonId(lesson);
    if (!key) return acc;
    acc[key] = Boolean(lesson.completed || lesson.done);
    return acc;
  }, {});

  if (!container.progress || typeof container.progress !== 'object') {
    container.progress = {};
  }
  container.progress.total = total;
  container.progress.completed = completed;
  container.progress.percentage = percentage;
  container.percent = percentage;

  return {
    total,
    completed,
    percentage,
    progressMap,
  };
};

const ensureCourseFixture = (courseId) => {
  const key = String(courseId);
  const fixture = COURSE_FIXTURES[key];
  if (!fixture) {
    throw createCourseNotFoundError();
  }
  return clone(fixture);
};

const resolveUserId = async () => {
  try {
    return await getHpUserId();
  } catch {
    return DEFAULT_USER_ID;
  }
};

const loadCompletedMap = async (uid) => {
  const raw = await AsyncStorage.getItem(K_COMPLETED(uid));
  return safeJsonParse(raw, {});
};

const saveCompletedMap = async (uid, map) => {
  await AsyncStorage.setItem(K_COMPLETED(uid), JSON.stringify(map));
};

const findPendingLessonId = (container, completedMap) => {
  const lessons = gatherLessons(container);
  const pending = lessons.find((lesson) => {
    const key = normalizeLessonId(lesson);
    if (!key) return false;
    return completedMap[key] !== true;
  });
  return pending ? normalizeLessonId(pending) : null;
};

const buildCourseProgressOverrides = async () => {
  const overrides = {};
  const ids = Object.keys(COURSE_FIXTURES);
  for (const courseId of ids) {
    try {
      const detail = await getCourseDetailMock(courseId);
      const container = resolveContainer(detail);
      const percent =
        container?.progress?.percentage ??
        hpParsePercent(container?.percent, 0);
      overrides[String(courseId)] = { percent };
    } catch {
      // ignore missing fixtures
    }
  }
  return overrides;
};

// === Public mock transport (raw fixtures) ===

export async function getUserCoursesMock() {
  // Return fixture verbatim; UI adapters take care of shaping.
  return clone(userCourses);
}

export async function getCourseDetailMock(courseId) {
  const uid = await resolveUserId();
  const completed = await loadCompletedMap(uid);
  const json = ensureCourseFixture(courseId);
  const container = resolveContainer(json);
  applyCompletionFromMap(container, completed);
  computeProgressSnapshot(container);
  return json;
}

export async function postCompleteLessonMock(lessonId, body = { done: true }) {
  const uid = await resolveUserId();
  const map = await loadCompletedMap(uid);
  const key = lessonId != null ? String(lessonId) : null;
  if (!key) {
    throw new Error('lesson_id requerido');
  }
  if (body?.done) {
    map[key] = true;
  } else {
    delete map[key];
  }
  await saveCompletedMap(uid, map);
  return { success: true };
}

// === Integrations with existing data layer ===

export async function mockListMyCourses() {
  const payload = await getUserCoursesMock();
  const courseProgress = await buildCourseProgressOverrides();
  return adaptHpUserCourses(payload, { courseProgress });
}

export async function mockGetCourse(courseId) {
  const detail = await getCourseDetailMock(courseId);
  const container = resolveContainer(detail);
  const lessons = gatherLessons(container);
  const progressMap = lessons.reduce((acc, lesson) => {
    const key = normalizeLessonId(lesson);
    if (!key) return acc;
    acc[key] = Boolean(lesson.completed || lesson.done);
    return acc;
  }, {});
  return adaptHpCourseDetail(detail, progressMap);
}

export async function mockGetProgress(courseId) {
  const detail = await getCourseDetailMock(courseId);
  const container = resolveContainer(detail);
  const snapshot = computeProgressSnapshot(container);
  return {
    course_id: Number(courseId),
    percent: snapshot.percentage,
    completed_lessons: snapshot.completed,
    total_lessons: snapshot.total,
    access: container?.access ?? 'owned',
    updated_at: Date.now(),
    progress: snapshot.progressMap,
  };
}

const resolveLessonIdForCompletion = async (courseId, lessonId) => {
  if (lessonId != null) {
    return String(lessonId);
  }
  const uid = await resolveUserId();
  const completed = await loadCompletedMap(uid);
  const json = ensureCourseFixture(courseId);
  const container = resolveContainer(json);
  const pending = findPendingLessonId(container, completed);
  if (!pending) {
    throw new Error('No hay lecciones pendientes por completar.');
  }
  return pending;
};

export async function mockSetProgress(courseId, lessonId, done = true) {
  const targetLessonId = await resolveLessonIdForCompletion(courseId, lessonId);
  await postCompleteLessonMock(targetLessonId, { done });
  return mockGetProgress(courseId);
}
