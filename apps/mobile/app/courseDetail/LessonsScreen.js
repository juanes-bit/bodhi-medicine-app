import React, { useCallback } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useNavigation } from "expo-router";
import LessonsTab from "../../src/courseDetail/LessonsTab";

const showAccessDialog = (setshowAccessDialog) => {
  if (typeof setshowAccessDialog === "function") {
    setshowAccessDialog(true);
    setTimeout(() => setshowAccessDialog(false), 1200);
  }
};

export default function LessonsScreen({ setshowAccessDialog }) {
  const navigation = useNavigation();

  const handlePlay = useCallback(
    (lesson) => {
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

      if (url) {
        navigation.push("webPlayer", {
          url,
          title,
        });
        return;
      }

      Alert.alert(
        "Bodhi Medicine",
        "Este video no tiene URL disponible aún.",
      );
    },
    [navigation, setshowAccessDialog],
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
