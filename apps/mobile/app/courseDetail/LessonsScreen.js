import React, { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import LessonsTab from "../../src/courseDetail/LessonsTab";
import { getLessonPlay } from "../../src/_core/bodhi";

const showAccessDialog = (setshowAccessDialog) => {
  if (typeof setshowAccessDialog === "function") {
    setshowAccessDialog(true);
    setTimeout(() => setshowAccessDialog(false), 1200);
  }
};

export default function LessonsScreen({ setshowAccessDialog }) {
  const handlePlay = useCallback(
    async (lesson) => {
      if (!lesson) return;

      const isLocked =
        Boolean(lesson?.is_locked ?? lesson?.locked ?? lesson?.locked_out);
      if (isLocked) {
        showAccessDialog(setshowAccessDialog);
        return;
      }

      const url =
        (lesson?.vimeo && lesson.vimeo.player_url) ??
        lesson?.player_url ??
        lesson?.url;
      const title = lesson?.title || lesson?.name || "Reproducción";

      const lessonId =
        lesson?.id ??
        lesson?.lesson_id ??
        lesson?.wp_lesson_id ??
        lesson?.wp_post_id ??
        null;

      if (lessonId != null) {
        try {
          const playback = await getLessonPlay(lessonId);
          const hlsUrl = playback?.hls_url ?? playback?.hls;
          if (hlsUrl) {
            router.push({
              pathname: "/nativePlayer",
              params: { hls: hlsUrl, title },
            });
            return;
          }
        } catch (error) {
          console.warn("[LessonsScreen] getLessonPlay failed", error);
        }
      }

      if (url) {
        router.push({
          pathname: "/webPlayer",
          params: { url, title },
        });
        return;
      }

      Alert.alert(
        "Bodhi Medicine",
        "Este video no tiene URL disponible aún.",
      );
    },
    [setshowAccessDialog],
  );

  return (
    <View style={styles.container}>
      <LessonsTab onPlay={handlePlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
