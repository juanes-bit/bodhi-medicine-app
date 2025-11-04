import { useQuery } from "@tanstack/react-query";
import { listMyCourses, me } from "../_core/bodhi";

const MY_COURSES_KEY = ["courses", "my"];
const PROFILE_KEY = ["profile", "me"];

export function useMyCoursesQuery(options = {}) {
  return useQuery({
    queryKey: MY_COURSES_KEY,
    queryFn: listMyCourses,
    retry: 1,
    ...options,
  });
}

export function useProfileQuery(options = {}) {
  return useQuery({
    queryKey: PROFILE_KEY,
    queryFn: me,
    staleTime: 10 * 60 * 1000,
    cacheTime: 60 * 60 * 1000,
    retry: 1,
    ...options,
  });
}
