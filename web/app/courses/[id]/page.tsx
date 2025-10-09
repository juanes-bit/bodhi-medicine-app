import CourseClient from './CourseClient';

type PageProps = {
  params: { id: string };
};

export default function Page({ params }: PageProps) {
  const id = Number(params.id);
  return <CourseClient id={id} />;
}
