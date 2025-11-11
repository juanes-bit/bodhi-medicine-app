const pickString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
    if (value && typeof value === 'object' && typeof value.rendered === 'string') {
      const rendered = value.rendered.trim();
      if (rendered) return rendered;
    }
  }
  return '';
};

const sanitizeContent = (value) => {
  const raw = pickString(value);
  if (!raw) return '';
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const coerceNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const coerceId = (value) => {
  if (value == null) return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return Number(numeric);
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isFinite(parsed)) return parsed;
  return null;
};

export const hpParsePercent = (value, fallback = 0) => {
  if (value == null) return fallback;
  if (typeof value === 'number') {
    return Math.max(0, Math.min(100, value));
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value.replace('%', '').trim());
    if (Number.isNaN(parsed)) return fallback;
    return Math.max(0, Math.min(100, parsed));
  }
  return fallback;
};

const computeOwned = (course) => {
  if (!course) return false;
  const access = typeof course.access === 'string' ? course.access.toLowerCase() : '';
  if (access === 'owned' || access === 'member' || access === 'free') {
    return true;
  }
  const flag =
    course.isOwned ??
    course.is_owned ??
    course.owned ??
    course.access_granted ??
    course.user_has_access ??
    false;
  return Boolean(flag);
};

export function adaptHpCourseSummary(course = {}, overrides = {}) {
  const id = coerceId(
    course.course_id ??
      course.id ??
      course.wp_post_id ??
      course.post_id ??
      course.ID,
  );
  const percentOverride = overrides?.percent;
  const percent =
    percentOverride != null
      ? hpParsePercent(percentOverride, 0)
      : hpParsePercent(course.percent ?? course.progress?.pct, 0);

  const modulesCount =
    coerceNumber(course.modules_count, null) ??
    (Array.isArray(course.modules) ? course.modules.length : 0);
  const lessonsCount =
    coerceNumber(course.lessons_count, null) ??
    coerceNumber(course.total_lessons, null) ??
    (Array.isArray(course.lessons) ? course.lessons.length : 0);

  const title = pickString(course.title, course.name, course.post_title);
  const image = pickString(
    course.image,
    course.cover_image,
    course.thumbnail,
    course.featured_image,
  );

  const summary =
    sanitizeContent(course.summary) ||
    sanitizeContent(course.excerpt) ||
    sanitizeContent(course.description);

  const owned = computeOwned(course);
  const access = course.access ?? (owned ? 'owned' : 'locked');

  return {
    id,
    courseId: id,
    title,
    image: image || null,
    excerpt: summary,
    summary,
    category: course.category ?? null,
    percent,
    modules_count: modulesCount ?? 0,
    lessons_count: lessonsCount ?? 0,
    is_owned: owned,
    isOwned: owned,
    access,
    raw: course,
  };
}

const defaultCourseResponse = {
  items: [],
  itemsOwned: [],
  total: 0,
  owned: 0,
  error: null,
  errorStatus: null,
  source: 'hp-mock',
};

export function adaptHpUserCourses(payload = {}, { courseProgress = {} } = {}) {
  const source = payload?.data ?? payload ?? {};
  const list = Array.isArray(source.items) ? source.items : [];
  const normalizedItems = list.map((item) => {
    const id = coerceId(item.course_id ?? item.id);
    const overrides = id != null ? courseProgress[String(id)] : null;
    return adaptHpCourseSummary(item, overrides);
  });

  const ownedMap = new Set(
    (Array.isArray(source.itemsOwned) ? source.itemsOwned : [])
      .map((entry) => coerceId(entry?.course_id ?? entry))
      .filter((id) => id != null),
  );

  const itemsOwned = normalizedItems.filter(
    (course) => course.isOwned || ownedMap.has(course.id),
  );

  return {
    ...defaultCourseResponse,
    items: normalizedItems,
    itemsOwned,
    total: Number.isFinite(source.total) ? source.total : normalizedItems.length,
    owned: Number.isFinite(source.owned) ? source.owned : itemsOwned.length,
  };
}

export function adaptUserCoursesToCards(payload = {}, options = {}) {
  const adapted = adaptHpUserCourses(payload, options);
  return adapted.items;
}

const adaptLessons = (lessons = [], progressMap = {}) =>
  lessons.map((lesson, index) => {
    const id =
      coerceId(lesson.id ?? lesson.lesson_id ?? lesson.post_id) ?? index;
    const progressKey = String(id);
    const done =
      progressMap?.[progressKey] ??
      lesson.done ??
      Boolean(lesson.completed ?? lesson.is_completed);

    return {
      id,
      title: pickString(lesson.title, lesson.name, lesson.post_title),
      duration: lesson.duration ?? null,
      done: Boolean(done),
      order: Number.isFinite(Number(lesson.order))
        ? Number(lesson.order)
        : index,
      video_url: lesson.video_url ?? lesson.video ?? null,
      raw: lesson,
    };
  });

export function adaptCourseDetail(payload = {}, lessonProgress = {}) {
  const detail = payload?.data ?? payload ?? {};
  const id = coerceId(detail.id ?? detail.course_id);
  const percent = hpParsePercent(detail.percent ?? detail.progress_pct, 0);
  const modules = Array.isArray(detail.modules) ? detail.modules : [];
  const adaptedModules = modules.map((module, index) => {
    const moduleId =
      coerceId(module.id ?? module.module_id ?? module.post_id) ?? index;
    const lessons = Array.isArray(module.lessons) ? module.lessons : [];
    return {
      id: moduleId,
      title: pickString(module.title, module.name, module.post_title),
      order: Number.isFinite(Number(module.order))
        ? Number(module.order)
        : index,
      lessons: adaptLessons(lessons, lessonProgress),
    };
  });

  const summary =
    sanitizeContent(detail.summary) ||
    sanitizeContent(detail.excerpt) ||
    sanitizeContent(detail.description);

  const totalLessons =
    detail.lessons_count ??
    detail.total_lessons ??
    adaptedModules.reduce(
      (acc, module) => acc + (Array.isArray(module.lessons) ? module.lessons.length : 0),
      0,
    );

  return {
    id,
    courseId: id,
    title: pickString(detail.title, detail.name, detail.post_title),
    image:
      pickString(detail.image, detail.cover_image, detail.featured_image) ||
      null,
    summary,
    description: detail.description ?? summary,
    category: detail.category ?? null,
    percent,
    lessons_count: Number.isFinite(Number(totalLessons))
      ? Number(totalLessons)
      : null,
    modules: adaptedModules,
    access: detail.access ?? 'owned',
    raw: detail,
  };
}

export { adaptCourseDetail as adaptHpCourseDetail };

export function collectLessonMap(modules = []) {
  const entries = [];
  modules.forEach((module) => {
    if (!Array.isArray(module?.lessons)) return;
    module.lessons.forEach((lesson) => {
      entries.push({
        moduleId: module.id,
        lessonId: lesson.id,
        done: Boolean(lesson.done),
      });
    });
  });
  return entries;
}
