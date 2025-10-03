import { useQuery } from "@tanstack/react-query";
import api from "../api/client";

async function fetchCourses() {
  const res = await api.get("/courses?lang=es");
  return res.data;
}

export default function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
    staleTime: 1000 * 60,
  });
}
