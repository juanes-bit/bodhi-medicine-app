import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Colors, Fonts, Sizes } from "../../constant/styles";
import { useCourseDetail } from "../../lib/courseDetailContext";

const getDescription = (detail) => {
  if (typeof detail?.summary === "string") return detail.summary;
  if (typeof detail?.short_description === "string") return detail.short_description;
  if (typeof detail?.excerpt === "string") return detail.excerpt;
  if (detail?.excerpt?.rendered) return stripHtml(detail.excerpt.rendered);
  return "Explora el potencial de tu salud integrando cuerpo, mente y emociones.";
};

const stripHtml = (input) => {
  if (typeof input !== "string") return "";
  return input.replace(/<[^>]*>?/gm, "").trim();
};

const extractMetaList = (detail) => {
  const meta = detail?.meta || detail?.course_meta;
  if (!meta || typeof meta !== "object") return [];
  const benefits =
    meta?.benefits ||
    meta?.key_points ||
    meta?.what_you_get ||
    [];
  if (Array.isArray(benefits)) {
    return benefits
      .map((item, index) => {
        if (typeof item === "string") {
          return { id: String(index), text: item };
        }
        if (item && typeof item === "object") {
          if (typeof item.label === "string") {
            return { id: String(index), text: item.label };
          }
          if (typeof item.text === "string") {
            return { id: String(index), text: item.text };
          }
        }
        return null;
      })
      .filter(Boolean);
  }
  return [];
};

export default function OverviewScreen() {
  const { loading, detail, progress, header } = useCourseDetail();

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color={Colors.primaryColor} />
      </View>
    );
  }

  if (!detail && !header) {
    return (
      <View style={styles.loaderContainer}>
        <Text style={styles.emptyText}>No encontramos información del curso.</Text>
      </View>
    );
  }

  const title = detail?.title ?? header?.title ?? "";
  const trailerUrl = detail?.trailer_url || detail?.trailer || null;
  const description = getDescription(detail);
  const benefitList = extractMetaList(detail);
  const progressPct = progress?.pct ?? progress?.percent ?? 0;
  const totalLessons = progress?.total ?? null;
  const completed = progress?.done ?? null;

  return (
    <View style={styles.container}>
      {!!title && <Text style={styles.titleText}>{title}</Text>}
      {!!trailerUrl && (
        <Text style={styles.linkText}>Tráiler: {trailerUrl}</Text>
      )}
      {(progressPct || totalLessons || completed) ? (
        <View style={styles.progressBox}>
          <Text style={styles.sectionLabel}>Resumen de tu progreso</Text>
          <Text style={styles.progressText}>
            {progressPct?.toFixed ? progressPct.toFixed(0) : Math.round(progressPct)}% completado
          </Text>
          {totalLessons != null && completed != null ? (
            <Text style={styles.progressSubText}>
              {completed} de {totalLessons} lecciones
            </Text>
          ) : null}
        </View>
      ) : null}
      {!!description && (
        <Text style={styles.descriptionText}>{description}</Text>
      )}
      {benefitList.length ? (
        <View style={styles.benefitsContainer}>
          <Text style={styles.sectionLabel}>Qué obtendrás</Text>
          {benefitList.map((item) => (
            <Text key={item.id} style={styles.benefitItem}>
              • {item.text}
            </Text>
          ))}
        </View>
      ) : null}
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
  titleText: {
    ...Fonts.black20Bold,
    marginBottom: Sizes.fixPadding,
  },
  linkText: {
    ...Fonts.primaryColor16Regular,
    marginBottom: Sizes.fixPadding,
  },
  sectionLabel: {
    ...Fonts.black18Bold,
    marginBottom: Sizes.fixPadding / 2,
  },
  progressBox: {
    backgroundColor: "#F4F6FB",
    padding: Sizes.fixPadding,
    borderRadius: Sizes.fixPadding,
    marginBottom: Sizes.fixPadding * 1.5,
  },
  progressText: {
    ...Fonts.primaryColor16Regular,
  },
  progressSubText: {
    ...Fonts.gray15Regular,
  },
  descriptionText: {
    ...Fonts.gray16Regular,
    lineHeight: 22,
    marginBottom: Sizes.fixPadding * 1.5,
  },
  benefitsContainer: {
    marginTop: Sizes.fixPadding,
  },
  benefitItem: {
    ...Fonts.gray15Regular,
    marginBottom: Sizes.fixPadding / 2,
  },
});
