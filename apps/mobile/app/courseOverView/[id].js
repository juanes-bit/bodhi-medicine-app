// apps/mobile/app/courseOverView/[id].js
import { useLocalSearchParams } from "expo-router";
import CourseOverViewScreen from "./courseOverViewScreen";
import { CourseDetailProvider } from "../../lib/courseDetailContext";

export default function CourseOverViewRoute() {
  const { id } = useLocalSearchParams();
  const courseId = Number(id);

  return (
    <CourseDetailProvider courseId={courseId}>
      <CourseOverViewScreen courseId={courseId} />
    </CourseDetailProvider>
  );
}
