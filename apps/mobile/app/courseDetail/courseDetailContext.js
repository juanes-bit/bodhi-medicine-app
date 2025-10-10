import React, { createContext, useContext } from "react";

const defaultValue = {
  courseId: null,
  detail: null,
  progress: null,
  loading: false,
  error: null,
  refresh: async () => {},
};

const CourseDetailContext = createContext(defaultValue);

export function CourseDetailProvider({ value, children }) {
  const merged = { ...defaultValue, ...(value || {}) };
  return (
    <CourseDetailContext.Provider value={merged}>
      {children}
    </CourseDetailContext.Provider>
  );
}

export function useCourseDetail() {
  return useContext(CourseDetailContext);
}

