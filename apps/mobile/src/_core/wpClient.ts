import { wpFetch } from './wp';

export const wpGet = async (path: string) => {
  const res = await wpFetch(path, { method: 'GET' });
  return res.json();
};

export const wpPost = async (path: string, body?: any) => {
  const res = await wpFetch(path, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
};
