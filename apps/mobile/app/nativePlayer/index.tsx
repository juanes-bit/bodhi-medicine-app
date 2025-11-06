import React, { useMemo } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import Video from "react-native-video";
import { Stack, useLocalSearchParams } from "expo-router";
import { Colors, Fonts } from "../../constant/styles";

export default function NativePlayer() {
  const params = useLocalSearchParams();
  const hls = useMemo(
    () =>
      typeof params?.hls === "string"
        ? params.hls
        : Array.isArray(params?.hls)
        ? params.hls[0]
        : "",
    [params],
  );
  const title = useMemo(
    () =>
      typeof params?.title === "string"
        ? params.title
        : Array.isArray(params?.title)
        ? params.title[0]
        : "Reproduciendo",
    [params],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title,
          presentation: "modal",
        }}
      />
      {hls ? (
        <Video
          source={{ uri: hls }}
          style={styles.video}
          controls
          resizeMode="contain"
          allowsExternalPlayback
        />
      ) : (
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>
            No encontramos un stream disponible.
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.blackColor,
  },
  video: {
    flex: 1,
    backgroundColor: Colors.blackColor,
  },
  fallbackContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.blackColor,
  },
  fallbackText: {
    ...Fonts.white15Regular,
  },
});
