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
import { useLocalSearchParams, useNavigation } from "expo-router";
import CollapsingToolbar from "../../component/sliverAppBar";
import MyStatusBar from "../../component/myStatusBar";
import TabBarScreen from "../../component/tabBarScreen";
import { Colors, Fonts, Sizes } from "../../constant/styles";
import { CourseDetailProvider, useCourseDetail } from "./courseDetailContext";

const { width } = Dimensions.get("screen");

const parseCourseId = (params) => {
  const raw =
    params.courseId ??
    params.id ??
    (Array.isArray(params) ? params[0] : null);
  const single = Array.isArray(raw) ? raw[0] : raw;
  const numeric = Number(single);
  if (Number.isFinite(numeric)) {
    return String(numeric);
  }
  return typeof single === "string" && single.trim() ? single.trim() : "";
};

const normalizePreload = (params) => {
  const isOwnedValue =
    typeof params.isOwned === "string"
      ? params.isOwned === "true"
      : params.isOwned != null
        ? Boolean(params.isOwned)
        : undefined;
  return {
    title:
      params.courseName ??
      params.title ??
      (Array.isArray(params?.courseName) ? params.courseName[0] : null),
    image: Array.isArray(params?.image) ? params.image[0] : params.image,
    category: Array.isArray(params?.courseCategory)
      ? params.courseCategory[0]
      : params.courseCategory,
    rating: params.courseRating
      ? Number(Array.isArray(params.courseRating) ? params.courseRating[0] : params.courseRating)
      : undefined,
    reviews: params.courseNumberOfRating
      ? Number(
          Array.isArray(params.courseNumberOfRating)
            ? params.courseNumberOfRating[0]
            : params.courseNumberOfRating,
        )
      : undefined,
    isOwned: isOwnedValue,
  };
};

const CourseDetailScreen = () => {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const [isInWatchList, setIsInWatchList] = useState(false);
  const [showAccessDialog, setshowAccessDialog] = useState(false);

  const courseId = useMemo(() => parseCourseId(params), [params]);
  const preload = useMemo(() => normalizePreload(params), [params]);

  if (!courseId) {
    return (
      <View style={styles.invalidContainer}>
        <MyStatusBar />
        <Text style={styles.errorText}>Curso inválido.</Text>
      </View>
    );
  }

  return (
    <CourseDetailProvider courseId={courseId} preload={preload}>
      <CourseDetailContent
        navigation={navigation}
        isInWatchList={isInWatchList}
        setIsInWatchList={setIsInWatchList}
        showAccessDialog={showAccessDialog}
        setshowAccessDialog={setshowAccessDialog}
      />
    </CourseDetailProvider>
  );
};

function CourseDetailContent({
  navigation,
  isInWatchList,
  setIsInWatchList,
  showAccessDialog,
  setshowAccessDialog,
}) {
  const { loading, error, detail, header, courseId } =
    useCourseDetail();

  const title =
    header?.title ||
    detail?.title ||
    detail?.name ||
    "Bodhi Medicine";
  const category =
    header?.category ||
    detail?.category ||
    detail?.courseCategory ||
    "";
  const rating = Number(
    header?.rating ??
      detail?.rating ??
      detail?.average_rating ??
      0,
  );
  const reviews =
    header?.reviews ??
    detail?.reviews_count ??
    detail?.rating_count ??
    0;
  const coverImage =
    header?.image || detail?.image || detail?.cover_image || null;

  const friendlyError = useMemo(() => formatError(error), [error]);

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
        element={courseInfo({
          navigation,
          title,
          category,
          rating,
          reviews,
          image: coverImage,
          courseId,
          detail,
        })}
        borderBottomRadius={20}
        toolbarColor={Colors.whiteColor}
        toolBarMinHeight={40}
        toolbarMaxHeight={370}
        isImageBlur
        src={coverImage}
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

const formatError = (error) => {
  if (!error) return null;
  const message =
    typeof error === "string" ? error : error?.message ?? null;
  const status =
    typeof error === "object" && error
      ? error.status ?? null
      : null;
  if (status === 401 || status === 403) {
    return "Necesitas iniciar sesión nuevamente para ver este curso.";
  }
  if (typeof message === "string") {
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
      // ignore, raw string
    }
    return message;
  }
  return "No pudimos cargar la información del curso.";
};

const courseInfo = ({
  navigation,
  title,
  category,
  rating,
  reviews,
  image,
  courseId,
  detail,
}) => {
  const resolvedCourseId =
    courseId ||
    detail?.id ||
    detail?.courseId ||
    detail?.course_id ||
    null;

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
  invalidContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding * 2,
  },
});

export default CourseDetailScreen;
