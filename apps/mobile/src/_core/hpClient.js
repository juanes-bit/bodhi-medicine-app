import { getHpBase, getHpJwt, getHpUserId } from './hpConfig';

const parse = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const hpError = (status, code, message) => {
  const error = new Error(`${code || 'HP_ERROR'}: ${message || 'Error HP'}`);
  error.status = status;
  error.code = code;
  return error;
};

async function hpFetch(path, init = {}) {
  const base = await getHpBase();
  const jwt = await getHpJwt();
  const headers = {
    'Content-Type': 'application/json',
    ...(init.headers || {}),
  };

  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers,
  });

  const bodyText = await response.text();
  const body = parse(bodyText);

  if (!response.ok) {
    throw hpError(response.status, body?.code, body?.message);
  }

  return body;
}

export async function getUserCourses() {
  const uid = await getHpUserId();
  return hpFetch(`/user/${uid}/courses`);
}

export async function getCourseDetail(courseId) {
  const uid = await getHpUserId();
  return hpFetch(`/user/${uid}/course/${courseId}`);
}

export async function postCompleteLesson(lessonId, body = { done: true }) {
  const uid = await getHpUserId();
  return hpFetch(`/user/${uid}/lesson/${lessonId}/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function health() {
  return hpFetch(`/health`);
}
