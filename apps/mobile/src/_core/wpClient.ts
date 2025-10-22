import { wpFetch } from './wp';

export const wpGet = async (path: string) => {
  return wpFetch(path, { method: 'GET' });
};

export const wpPost = async (path: string, body?: any) => {
  return wpFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
};
