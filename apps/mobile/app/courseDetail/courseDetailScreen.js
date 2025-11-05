import { useLocalSearchParams } from "expo-router";
import { CourseDetailProvider } from "../../src/contexts/courseDetail";
import Tabs from "./_Tabs";

const coerceParam = (value) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? "";
};

export default function CourseDetailScreen() {
  const params = useLocalSearchParams();
  const courseId = coerceParam(params.courseId || params.id);
  const title = coerceParam(params.title || params.courseName);
  const image = coerceParam(params.image);
  const category = coerceParam(params.courseCategory);
  const rating = coerceParam(params.courseRating);
  const reviews = coerceParam(params.courseNumberOfRating);
  const isOwned = coerceParam(params.isOwned);

  const preload = {
    title,
    image,
    category,
    rating,
    reviews,
    isOwned,
  };

  return (
    <CourseDetailProvider courseId={courseId} preload={preload}>
      <Tabs />
    </CourseDetailProvider>
  );
}
