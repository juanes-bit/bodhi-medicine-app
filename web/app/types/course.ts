import type { Lesson } from './lesson';

export type CourseModule = {
  id: number;
  title: string;
  order?: number;
  cover_image?: string;
  publish_date?: string;
  schema?: any[];
  lessons?: Array<{ id: number; title: string }>;
};

export type CourseDetail = {
  id: number;
  title?: string;
  modules?: CourseModule[];
  lessons?: Lesson[];
};

export type ProgressRes = {
  pct: number;
  total: number;
  done: number;
  progress: Record<string, boolean>;
  course_id: number;
};

export type Me = {
  logged_in: boolean;
  id?: number;
  name?: string;
};
