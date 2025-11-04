import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Text,
  View,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Fonts, Sizes, Colors, CommonStyles } from "../../../constant/styles";
import CollapsingToolbar from "../../../component/sliverAppBar";
import { useMyCoursesQuery } from "../../../src/hooks/useBodhiQueries";
import Skeleton from "../../../component/skeleton";

const { width } = Dimensions.get("screen");
const SKELETON_ITEMS = [0, 1, 2];

const CoursesScreen = () => {
  const {
    data,
    isLoading,
    isFetching,
    error: queryError,
  } = useMyCoursesQuery({ retry: 1 });

  const courses = data?.itemsOwned ?? [];
  const shouldShowSkeleton = isLoading && !data;
  const isRefreshing = isFetching && !shouldShowSkeleton;
  const errorMessage = useMemo(() => {
    if (data?.error) return String(data.error);
    if (queryError) return String(queryError?.message || queryError);
    return null;
  }, [data?.error, queryError]);

  const renderItem = (item) => {
    const placeholder = require("../../../assets/images/new_course/new_course_4.png");
    const isRemoteImage =
      typeof item.image === "string" && item.image.trim().length > 0;
    const imageSource = isRemoteImage
      ? { uri: item.image }
      : item.image || placeholder;

    return (
      <View key={item.id ?? item.title} style={styles.courseContainerStyle}>
        <ExpoImage
          source={imageSource}
          style={styles.courseImageStyle}
          contentFit="cover"
          transition={200}
          {...(isRemoteImage ? { cachePolicy: "memory-disk" } : {})}
        />
        <View style={styles.courseInfoContainerStyle}>
          <Text style={{ ...Fonts.black17Bold }}>{item.title || "Curso"}</Text>
          {item.summary ? (
            <Text
              style={{ ...Fonts.gray16Regular, marginVertical: Sizes.fixPadding - 3.0 }}
              numberOfLines={3}
            >
              {item.summary}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  const renderSkeletons = () =>
    SKELETON_ITEMS.map((item) => (
      <View key={`course-skeleton-${item}`} style={styles.courseContainerStyle}>
        <Skeleton style={styles.courseImageStyle} />
        <View style={styles.courseInfoContainerStyle}>
          <Skeleton style={styles.courseSkeletonTitle} />
          <Skeleton style={styles.courseSkeletonSubtitle} />
        </View>
      </View>
    ));

  const renderContent = () => {
    if (shouldShowSkeleton) {
      return renderSkeletons();
    }

    if (errorMessage) {
      return (
        <View style={styles.feedbackContainer}>
          <Text style={{ ...Fonts.gray16Regular }}>{errorMessage}</Text>
        </View>
      );
    }

    if (!courses.length) {
      return (
        <View style={styles.feedbackContainer}>
          <Text style={{ ...Fonts.gray16Regular }}>
            Aún no tienes cursos adquiridos.
          </Text>
        </View>
      );
    }

    return courses.map(renderItem);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <CollapsingToolbar
        element={
          <Text style={{ ...Fonts.black25Bold, color: Colors.whiteColor }}>
            Mis Cursos
          </Text>
        }
        toolbarColor={Colors.primaryColor}
        toolBarMinHeight={40}
        toolbarMaxHeight={230}
        src={require("../../../assets/images/appbar_bg.png")}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: Sizes.fixPadding,
            paddingBottom: Sizes.fixPadding * 2,
          }}
          showsVerticalScrollIndicator={false}
        >
          {isRefreshing ? (
            <View style={styles.feedbackContainer}>
              <ActivityIndicator color={Colors.primaryColor} size="small" />
              <Text style={{ ...Fonts.gray16Regular, marginTop: Sizes.fixPadding / 2 }}>
                Actualizando cursos...
              </Text>
            </View>
          ) : null}
          {renderContent()}
        </ScrollView>
      </CollapsingToolbar>
    </View>
  );
};

const styles = StyleSheet.create({
  courseContainerStyle: {
    flexDirection: "row",
    width: width - 20,
    elevation: 2.0,
    ...CommonStyles.shadow,
    backgroundColor: Colors.whiteColor,
    paddingVertical: Sizes.fixPadding + 5.0,
    borderRadius: Sizes.fixPadding * 2.0,
    alignSelf: "center",
    marginVertical: Sizes.fixPadding,
    alignItems: "center",
  },
  courseImageStyle: {
    height: 115.0,
    width: 115.0,
    borderRadius: Sizes.fixPadding * 2.0,
    marginLeft: Sizes.fixPadding,
  },
  courseInfoContainerStyle: {
    marginLeft: Sizes.fixPadding,
    width: width - 160,
    marginVertical: 3.0,
  },
  courseSkeletonTitle: {
    height: 18,
    width: width * 0.45,
    borderRadius: Sizes.fixPadding,
    marginBottom: Sizes.fixPadding / 1.5,
  },
  courseSkeletonSubtitle: {
    height: 14,
    width: width * 0.35,
    borderRadius: Sizes.fixPadding,
  },
  feedbackContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Sizes.fixPadding * 2,
    paddingHorizontal: Sizes.fixPadding * 2,
  },
});

export default CoursesScreen;
