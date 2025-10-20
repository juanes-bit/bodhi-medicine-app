import { useQuery } from "@tanstack/react-query";
import api, { WP_API_PREFIX } from "../api/client";

async function fetchCourseDetail(id) {
  const res = await api.get(`${WP_API_PREFIX}/courses/${id}?lang=es`);
  return res.data;
}

export default function useCourseDetail(id) {
  return useQuery({
    queryKey: ["courseDetail", id],
    queryFn: () => fetchCourseDetail(id),
    enabled: !!id,
  });
}
