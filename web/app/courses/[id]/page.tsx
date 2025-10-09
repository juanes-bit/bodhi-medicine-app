import CourseClient from './CourseClient';

type PageProps = {
  params: { id: string };
};

export default function Page({ params }: PageProps) {
  const courseId = Number(params.id);
  return <CourseClient courseId={courseId} />;
}
