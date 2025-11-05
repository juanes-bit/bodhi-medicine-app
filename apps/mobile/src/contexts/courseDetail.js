import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getCourse, getProgress } from "../_core/bodhi";

const defaultState = {
  loading: true,
  courseId: null,
  detail: null,
  modules: [],
  progress: null,
  header: {},
  error: null,
  refresh: async () => {},
  setProgressState: () => {},
};

const CourseDetailContext = createContext(defaultState);

const normalizeHeader = (detail = {}, previous = {}) => {
  const resolvedTitle =
    typeof detail?.title === "string" && detail.title.trim()
      ? detail.title
      : previous?.title;
  const resolvedImage =
    typeof detail?.image === "string" && detail.image.trim()
      ? detail.image
      : previous?.image;
  const resolvedCategory =
    typeof detail?.category === "string" && detail.category.trim()
      ? detail.category
      : previous?.category;
  const resolvedRating =
    typeof detail?.rating === "number" ? detail.rating : previous?.rating;
  const resolvedReviews =
    typeof detail?.reviews_count === "number"
      ? detail.reviews_count
      : previous?.reviews;
  const resolvedOwned =
    detail?.isOwned ??
    detail?.is_owned ??
    detail?.owned ??
    previous?.isOwned ??
    null;

  return {
    ...previous,
    title: resolvedTitle,
    image: resolvedImage,
    category: resolvedCategory,
    rating: resolvedRating,
    reviews: resolvedReviews,
    isOwned: resolvedOwned,
  };
};

export function CourseDetailProvider({ courseId: rawId, preload = {}, children }) {
  const stringId = rawId != null ? String(rawId) : "";
  const aliveRef = useRef(true);
  const normalizedPreload = useMemo(() => {
    if (!preload) return {};
    const isOwnedValue =
      typeof preload.isOwned === "string"
        ? preload.isOwned === "true"
        : preload.isOwned != null
          ? Boolean(preload.isOwned)
          : undefined;
    return {
      title: preload.title,
      image: preload.image,
      category: preload.category,
      rating: preload.rating,
      reviews: preload.reviews,
      isOwned: isOwnedValue,
    };
  }, [preload]);

  const [state, setState] = useState({
    loading: true,
    courseId: stringId,
    detail: null,
    modules: [],
    progress: null,
    header: normalizedPreload,
    error: null,
  });

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  useEffect(() => {
    setState((current) => ({
      ...current,
      courseId: stringId,
      header: normalizeHeader({}, normalizedPreload),
    }));
  }, [stringId, normalizedPreload]);

  const performFetch = useCallback(async () => {
    if (!stringId) {
      if (aliveRef.current) {
        setState((current) => ({
          ...current,
          loading: false,
          error: "Curso inválido.",
        }));
      }
      return;
    }

    setState((current) => ({
      ...current,
      loading: true,
      error: null,
      courseId: stringId,
    }));

    try {
      const [detail, progress] = await Promise.all([
        getCourse(stringId),
        getProgress(stringId),
      ]);

      if (!aliveRef.current) return;

      setState((current) => ({
        ...current,
        loading: false,
        detail,
        modules: Array.isArray(detail?.modules) ? detail.modules : [],
        progress: progress ?? null,
        header: normalizeHeader(detail, current.header),
        error: null,
      }));
    } catch (error) {
      if (!aliveRef.current) return;
      const message =
        typeof error?.message === "string" && error.message.trim()
          ? error.message
          : "Ocurrió un error al cargar el curso.";
      setState((current) => ({
        ...current,
        loading: false,
        error: message,
      }));
    }
  }, [stringId]);

  useEffect(() => {
    performFetch();
  }, [performFetch]);

  const refresh = useCallback(async () => {
    await performFetch();
  }, [performFetch]);

  const setProgressState = useCallback((progress) => {
    setState((current) => ({
      ...current,
      progress,
    }));
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      refresh,
      setProgressState,
    }),
    [state, refresh, setProgressState],
  );

  return (
    <CourseDetailContext.Provider value={value}>
      {children}
    </CourseDetailContext.Provider>
  );
}

export function useCourseDetail() {
  return useContext(CourseDetailContext);
}
