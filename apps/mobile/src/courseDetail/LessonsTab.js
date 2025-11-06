import { useContext, useMemo } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors, Fonts, Sizes } from "../../constant/styles";
import { CourseDetailContext } from "./CourseDetailProvider";

const formatDuration = (seconds) => {
  const totalSeconds = Number(seconds);
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) return null;
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = Math.floor(totalSeconds % 60);
  const paddedSeconds = remainingSeconds.toString().padStart(2, "0");
  return `${minutes}:${paddedSeconds} min`;
};

const ModuleCard = ({ title, children }) => (
  <View style={styles.moduleCard}>
    {title ? <Text style={styles.moduleTitle}>{title}</Text> : null}
    <View style={styles.moduleContent}>{children}</View>
  </View>
);

const LessonRow = ({ title, duration, locked, onPress }) => (
  <TouchableOpacity
    activeOpacity={locked ? 1 : 0.85}
    style={[styles.lessonRow, locked && styles.lessonRowLocked]}
    onPress={locked ? undefined : onPress}
  >
    <View style={styles.lessonTextContainer}>
      <Text style={styles.lessonTitle}>{title || "Lección"}</Text>
      {duration ? <Text style={styles.lessonDuration}>{duration}</Text> : null}
    </View>
    <Text style={locked ? styles.lessonLocked : styles.lessonUnlocked}>
      {locked ? "Bloqueada" : "Disponible"}
    </Text>
  </TouchableOpacity>
);

export default function LessonsTab({ onPlay }) {
  const { data, loading, error } = useContext(CourseDetailContext);

  const modules = useMemo(() => {
    if (!data || !Array.isArray(data.modules)) return [];
    return data.modules.filter((module) => module && typeof module === "object");
  }, [data]);

  if (loading) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Cargando lecciones…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {typeof error === "string" ? error : "No pudimos cargar las lecciones."}
        </Text>
      </View>
    );
  }

  if (!modules.length) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Sin módulos disponibles.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={modules}
      keyExtractor={(module, index) =>
        module?.id != null ? String(module.id) : `module-${index}`
      }
      renderItem={({ item: module }) => {
        const lessons = Array.isArray(module?.lessons)
          ? module.lessons
          : [];

        return (
          <ModuleCard title={module?.title || module?.name}>
            {lessons.length ? (
              lessons.map((lesson, index) => {
                const locked =
                  Boolean(lesson?.is_locked ?? lesson?.locked ?? lesson?.locked_out) ||
                  Boolean(module?.is_locked);

                return (
                  <LessonRow
                    key={lesson?.id ?? `lesson-${module?.id ?? "m"}-${index}`}
                    title={lesson?.title || lesson?.name}
                    duration={formatDuration(lesson?.duration_sec ?? lesson?.duration)}
                    locked={locked}
                    onPress={() => onPlay?.(lesson, module)}
                  />
                );
              })
            ) : (
              <Text style={styles.emptyLessons}>Sin lecciones en este módulo.</Text>
            )}
          </ModuleCard>
        );
      }}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.listContent}
      nestedScrollEnabled
      removeClippedSubviews={false}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: Sizes.fixPadding * 1.5,
  },
  moduleCard: {
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding * 1.5,
    marginHorizontal: Sizes.fixPadding * 2,
    paddingVertical: Sizes.fixPadding * 1.5,
    paddingHorizontal: Sizes.fixPadding * 1.5,
    ...{
      shadowColor: Colors.blackColor,
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  },
  moduleTitle: {
    ...Fonts.black19Bold,
    marginBottom: Sizes.fixPadding,
  },
  moduleContent: {
    gap: Sizes.fixPadding,
  },
  lessonRow: {
    backgroundColor: "#F4F6FB",
    borderRadius: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding,
    paddingHorizontal: Sizes.fixPadding * 1.5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lessonRowLocked: {
    opacity: 0.6,
  },
  lessonTextContainer: {
    flex: 1,
    marginRight: Sizes.fixPadding,
  },
  lessonTitle: {
    ...Fonts.black17Bold,
    marginBottom: 2,
  },
  lessonDuration: {
    ...Fonts.gray15Regular,
  },
  lessonLocked: {
    ...Fonts.gray15Regular,
  },
  lessonUnlocked: {
    ...Fonts.primaryColor16Regular,
  },
  emptyLessons: {
    ...Fonts.gray15Regular,
  },
  separator: {
    height: Sizes.fixPadding * 1.5,
  },
  statusContainer: {
    paddingVertical: Sizes.fixPadding * 3,
    alignItems: "center",
  },
  statusText: {
    ...Fonts.gray16Regular,
    textAlign: "center",
  },
});
