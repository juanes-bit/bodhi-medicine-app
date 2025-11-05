import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Snackbar } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import CollapsingToolbar from "../../component/sliverAppBar";
import MyStatusBar from "../../component/myStatusBar";
import TabBarScreen from "../../component/tabBarScreen";
import { Colors, Fonts, Sizes } from "../../constant/styles";
import { useCourseDetail } from "./courseDetailContext";

const { width } = Dimensions.get("screen");

const formatError = (error) => {
  if (!error) return null;
  const status = error?.status ?? null;
  if (status === 401 || status === 403) {
    return "Necesitas iniciar sesión nuevamente para ver este curso.";
  }
  const message =
    typeof error === "string"
      ? error
      : typeof error?.message === "string"
        ? error.message
        : null;
  if (typeof message === "string" && message.trim()) {
    try {
      const parsed = JSON.parse(message);
      if (
        parsed &&
        typeof parsed === "object" &&
        typeof parsed.message === "string"
      ) {
        return parsed.message;
      }
    } catch {
      // ignore
    }
    return message;
  }
  return "No pudimos cargar la información del curso.";
};

const resolveCourseId = (raw, detail) => {
  if (raw) return raw;
  const candidates = [
    detail?.id,
    detail?.courseId,
    detail?.course_id,
    detail?.wp_post_id,
  ];
  const resolved = candidates.find((candidate) =>
    candidate != null && `${candidate}`.trim(),
  );
  return resolved != null ? String(resolved) : "";
};

const resolveHeaderValue = (detail, header) => {
  const title =
    (detail?.title && detail.title.trim()) ||
    (header?.title && header.title.trim()) ||
    "Bodhi Medicine";
  const category =
    (detail?.category && detail.category.trim()) || header?.category || "";
  const rating = Number(
    header?.rating ?? detail?.rating ?? detail?.average_rating ?? 0,
  );
  const reviews =
    header?.reviews ?? detail?.reviews_count ?? detail?.rating_count ?? 0;
  const image = header?.image || detail?.image || detail?.cover_image || null;
  return { title, category, rating, reviews, image };
};

function CourseDetailTabs() {
  const navigation = useNavigation();
  const [isInWatchList, setIsInWatchList] = useState(false);
  const [showAccessDialog, setshowAccessDialog] = useState(false);
  const { loading, error, detail, header, courseId } = useCourseDetail();

  const { title, category, rating, reviews, image } = useMemo(
    () => resolveHeaderValue(detail, header),
    [detail, header],
  );

  const friendlyError = useMemo(() => formatError(error), [error]);
  const normalizedCourseId = useMemo(
    () => resolveCourseId(courseId, detail),
    [courseId, detail],
  );

  return (
    <View style={{ flex: 1 }}>
      <MyStatusBar />
      <CollapsingToolbar
        leftItem={
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color={Colors.primaryColor}
            onPress={() => navigation.pop()}
          />
        }
        rightItem={
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => setIsInWatchList(!isInWatchList)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons
              name={isInWatchList ? "done" : "add"}
              size={24}
              color={Colors.primaryColor}
            />
            <Text
              style={{
                ...Fonts.primaryColor16Regular,
                marginLeft: Sizes.fixPadding - 5.0,
              }}
            >
              {isInWatchList ? "Added to Wishlist" : "Add to Wishlist"}
            </Text>
          </TouchableOpacity>
        }
        element={
          renderHeader({
            navigation,
            title,
            category,
            rating,
            reviews,
            image,
            courseId: normalizedCourseId,
            detail,
          })
        }
        borderBottomRadius={20}
        toolbarColor={Colors.whiteColor}
        toolBarMinHeight={40}
        toolbarMaxHeight={370}
        isImageBlur
        src={image}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="small" color={Colors.primaryColor} />
          </View>
        ) : null}
        {friendlyError && !loading ? (
          <Text style={styles.errorText}>{friendlyError}</Text>
        ) : null}
        <TabBarScreen
          navigation={navigation}
          setshowAccessDialog={setshowAccessDialog}
        />
      </CollapsingToolbar>

      <Snackbar
        style={styles.snackbarStyle}
        elevation={0}
        visible={showAccessDialog}
        onDismiss={() => setshowAccessDialog(false)}
      >
        First purchase this course then you access this lesson.
      </Snackbar>
    </View>
  );
}

const renderHeader = ({
  navigation,
  title,
  category,
  rating,
  reviews,
  image,
  courseId,
  detail,
}) => {
  const resolvedCourseId = resolveCourseId(courseId, detail);

  return (
    <View>
      <Text style={{ ...Fonts.primaryColor16Regular }}>{category}</Text>
      <Text
        style={{
          ...Fonts.primaryColor28Bold,
          color: "white",
          marginVertical: Sizes.fixPadding,
        }}
      >
        {title}
      </Text>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ ...Fonts.primaryColor16Regular }}>
            {Number.isFinite(rating) ? rating.toFixed(1) : "0.0"}
          </Text>
          <MaterialIcons name="star" size={17} color={Colors.primaryColor} />
          <Text style={{ ...Fonts.primaryColor16Regular }}>
            ({reviews} Reviews)
          </Text>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() =>
          navigation.push("takeCourse/takeCourseScreen", {
            courseName: title,
            image,
            courseId: resolvedCourseId,
          })
        }
        style={styles.takeTheCourseContainerStyle}
      >
        <Text style={{ ...Fonts.black17Bold }}>Tomar el curso</Text>
      </TouchableOpacity>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.push("watchTrailer/watchTrailerScreen")}
        style={styles.watchTrailerContainerStyle}
      >
        <Text style={{ ...Fonts.black17Bold }}>Ver tráiler</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    paddingVertical: Sizes.fixPadding,
    alignItems: "center",
  },
  errorText: {
    ...Fonts.gray16Regular,
    paddingHorizontal: Sizes.fixPadding * 2,
    paddingBottom: Sizes.fixPadding,
    textAlign: "center",
  },
  takeTheCourseContainerStyle: {
    backgroundColor: Colors.primaryColor,
    paddingVertical: Sizes.fixPadding + 2.0,
    alignItems: "center",
    justifyContent: "center",
    width: width - 40,
    borderRadius: Sizes.fixPadding - 5.0,
    marginTop: Sizes.fixPadding + 3.0,
    marginBottom: Sizes.fixPadding,
  },
  watchTrailerContainerStyle: {
    backgroundColor: Colors.whiteColor,
    paddingVertical: Sizes.fixPadding + 2.0,
    alignItems: "center",
    justifyContent: "center",
    width: width - 40,
    borderRadius: Sizes.fixPadding - 5.0,
    marginBottom: Sizes.fixPadding - 5.0,
  },
  snackbarStyle: {
    position: "absolute",
    left: -10.0,
    right: -10.0,
    bottom: -10.0,
    backgroundColor: "#333333",
  },
});

export default CourseDetailTabs;
