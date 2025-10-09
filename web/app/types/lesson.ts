export type LessonMedia = {
  provider: 'vimeo';
  id: string;
  h?: string;
  downloads?: Array<{ quality: '720p' | '1080p' | 'hls'; url: string }>;
};

export type Lesson = {
  id: number;
  title: string;
  moduleId?: number;
  type?: 'video' | 'form' | 'article';
  url?: string;
  order?: number;
  preview_url?: string;
  courseId?: number;
  courseTitle?: string;
  done?: boolean;
  media?: LessonMedia;
};
