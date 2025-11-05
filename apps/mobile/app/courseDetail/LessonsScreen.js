import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors, Fonts, Sizes } from "../../constant/styles";
import { useCourseDetail } from "../../lib/courseDetailContext";

const renderLessons = (module) => {
  if (!Array.isArray(module?.lessons) || !module.lessons.length) {
    return (
      <Text style={styles.emptyLessonText}>Sin lecciones disponibles.</Text>
    );
  }
  return module.lessons.map((lesson, index) => (
    <Text key={lesson?.id ?? index} style={styles.lessonItem}>
      • {lesson?.title || lesson?.name || "Lección"}
    </Text>
  ));
};

export default function LessonsScreen() {
  const { loading, modules } = useCourseDetail();

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={Colors.primaryColor} />
      </View>
    );
  }

  if (!Array.isArray(modules) || !modules.length) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.emptyText}>Sin módulos disponibles.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {modules.map((module, index) => (
        <View key={module?.id ?? `module-${index}`} style={styles.moduleBox}>
          <Text style={styles.moduleTitle}>
            {module?.title || module?.name || `Módulo ${index + 1}`}
          </Text>
          {renderLessons(module)}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Sizes.fixPadding * 2,
    paddingVertical: Sizes.fixPadding * 2,
  },
  loaderContainer: {
    paddingVertical: Sizes.fixPadding * 3,
    alignItems: "center",
  },
  emptyText: {
    ...Fonts.gray16Regular,
  },
  moduleBox: {
    marginBottom: Sizes.fixPadding * 2,
  },
  moduleTitle: {
    ...Fonts.black18Bold,
    marginBottom: Sizes.fixPadding,
  },
  lessonItem: {
    ...Fonts.gray16Regular,
    marginBottom: Sizes.fixPadding / 2,
  },
  emptyLessonText: {
    ...Fonts.gray15Regular,
    fontStyle: "italic",
  },
});
