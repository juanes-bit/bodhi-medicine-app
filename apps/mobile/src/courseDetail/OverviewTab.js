import { useContext } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Fonts, Sizes } from "../../constant/styles";
import { CourseDetailContext } from "./CourseDetailProvider";

const formatPercent = (value) => {
  if (!Number.isFinite(Number(value))) {
    return null;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(numeric)));
};

const ProgressCard = ({ percent, lessons }) => {
  const resolvedPercent = formatPercent(percent);
  const resolvedLessons = Number.isFinite(Number(lessons))
    ? Number(lessons)
    : null;

  if (resolvedPercent == null && resolvedLessons == null) {
    return null;
  }

  return (
    <View style={styles.progressCard}>
      {resolvedPercent != null ? (
        <Text style={styles.progressPercent}>{resolvedPercent}% completado</Text>
      ) : null}
      {resolvedLessons != null ? (
        <Text style={styles.progressLessons}>
          {resolvedLessons} lecciones en total
        </Text>
      ) : null}
    </View>
  );
};

const BodyText = ({ children }) => {
  if (!children) return null;
  return <Text style={styles.bodyText}>{children}</Text>;
};

export default function OverviewTab() {
  const { data, loading, error } = useContext(CourseDetailContext);

  if (loading) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Cargando descripción…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {typeof error === "string" ? error : "Ocurrió un error."}
        </Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          No encontramos información del curso.
        </Text>
      </View>
    );
  }

  return (
    <>
      <ProgressCard
        percent={data.percent ?? data.progress_pct ?? data.progress?.pct}
        lessons={
          data.lessons_count ??
          data.total_lessons ??
          data.count ?? //
            (Array.isArray(data.modules)
              ? data.modules.reduce(
                  (acc, module) =>
                    acc +
                    (Array.isArray(module?.lessons)
                      ? module.lessons.length
                      : 0),
                  0,
                )
              : null)
        }
      />
      <BodyText>
        {typeof data.excerpt === "string" && data.excerpt.trim()
          ? data.excerpt.trim()
          : data.summary ?? data.description ?? " "}
      </BodyText>
    </>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    backgroundColor: "#F4F6FB",
    borderRadius: Sizes.fixPadding * 1.5,
    paddingVertical: Sizes.fixPadding * 1.5,
    paddingHorizontal: Sizes.fixPadding * 2,
    marginBottom: Sizes.fixPadding * 1.5,
  },
  progressPercent: {
    ...Fonts.primaryColor23Bold,
    marginBottom: Sizes.fixPadding / 2,
  },
  progressLessons: {
    ...Fonts.gray16Regular,
  },
  bodyText: {
    ...Fonts.gray16Regular,
    lineHeight: 22,
  },
  statusContainer: {
    paddingVertical: Sizes.fixPadding * 2,
    alignItems: "center",
  },
  statusText: {
    ...Fonts.gray16Regular,
    textAlign: "center",
  },
});
