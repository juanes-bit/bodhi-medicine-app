import React, { useEffect, useMemo } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useNavigation } from "expo-router";
import MyStatusBar from "../../component/myStatusBar";
import { Colors, Fonts } from "../../constant/styles";

const coerceParam = (value) => {
  if (Array.isArray(value)) return value[0];
  return value ?? "";
};

export default function WebPlayerScreen() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const url = useMemo(() => coerceParam(params.url), [params.url]);
  const title = useMemo(
    () => coerceParam(params.title) || "Reproducción",
    [params.title],
  );

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    navigation.setParams({ title });
  }, [navigation, title]);

  if (!url) {
    return (
      <View style={styles.fallbackContainer}>
        <MyStatusBar />
        <Text style={styles.fallbackText}>
          No encontramos el video solicitado.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MyStatusBar />
      <WebView
        source={{ uri: url }}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color={Colors.primaryColor} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.blackColor,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fallbackContainer: {
    flex: 1,
    backgroundColor: Colors.whiteColor,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  fallbackText: {
    ...Fonts.gray16Regular,
    textAlign: "center",
  },
});
