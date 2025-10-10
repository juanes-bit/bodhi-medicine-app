import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Text,
    View,
    Dimensions,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
} from "react-native";
import CollapsingToolbar from "../../component/sliverAppBar";
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Fonts, Sizes } from "../../constant/styles";
import TabBarScreen from "../../component/tabBarScreen";
import MyStatusBar from "../../component/myStatusBar";
import { Snackbar } from "react-native-paper";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { wpGet } from "../_core/wpClient";
import { CourseDetailProvider } from "./courseDetailContext";

const { width } = Dimensions.get('screen');

const CourseDetailScreen = () => {

    const navigation = useNavigation();

    const [isInWatchList, setIsInWatchList] = useState(false);

    const [showAccessDialog, setshowAccessDialog] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [detail, setDetail] = useState(null);
    const [progress, setProgress] = useState(null);

    const {
        image,
        courseName,
        courseCategory,
        courseRating,
        courseNumberOfRating,
        courseId: courseIdParam,
    } = useLocalSearchParams();

    const parsedCourseId = useMemo(() => {
        const raw = Array.isArray(courseIdParam) ? courseIdParam[0] : courseIdParam;
        const parsed = Number(raw);
        return Number.isFinite(parsed) ? parsed : null;
    }, [courseIdParam]);

    const courseId = parsedCourseId;

    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const safeSetState = useCallback((setter) => {
        if (isMountedRef.current) {
            setter();
        }
    }, []);

    const refresh = useCallback(async () => {
        if (!courseId) return;
        safeSetState(() => {
            setLoading(true);
            setError(null);
        });
        try {
            const [courseResponse, progressResponse] = await Promise.allSettled([
                wpGet(`/wp-json/bodhi/v1/courses/${courseId}`),
                wpGet(`/wp-json/bodhi/v1/progress?course_id=${courseId}`),
            ]);

            if (courseResponse.status === "fulfilled") {
                safeSetState(() => setDetail(courseResponse.value));
            } else if (courseResponse.status === "rejected") {
                safeSetState(() =>
                    setError(
                        courseResponse.reason instanceof Error
                            ? courseResponse.reason
                            : new Error("No se pudo cargar la información del curso."),
                    ),
                );
            }

            if (progressResponse.status === "fulfilled") {
                safeSetState(() => setProgress(progressResponse.value));
            }
        } catch (err) {
            safeSetState(() =>
                setError(err instanceof Error ? err : new Error("Unknown error")),
            );
        } finally {
            safeSetState(() => setLoading(false));
        }
    }, [courseId, safeSetState]);

    useEffect(() => {
        if (!courseId) return;
        refresh();
    }, [courseId, refresh]);

    return (
        <CourseDetailProvider
            value={{
                courseId,
                detail,
                progress,
                loading,
                error,
                refresh,
            }}
        >
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
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: "center" }}
                        >
                            <MaterialIcons
                                name={isInWatchList ? "done" : "add"}
                                size={24}
                                color={Colors.primaryColor}
                            />
                            <Text style={{ ...Fonts.primaryColor16Regular, marginLeft: Sizes.fixPadding - 5.0 }}>
                                {isInWatchList ? "Added to Wishlist" : "Add to Wishlist"}
                            </Text>
                        </TouchableOpacity>
                    }
                    element={
                        courseInfo()
                    }
                    borderBottomRadius={20}
                    toolbarColor={Colors.whiteColor}
                    toolBarMinHeight={40}
                    toolbarMaxHeight={370}
                    isImageBlur={true}
                    src={image}
                >
                    {loading && (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="small" color={Colors.primaryColor} />
                        </View>
                    )}
                    {error && !loading && (
                        <Text style={styles.errorText}>
                            {error.message || "No pudimos cargar la información del curso."}
                        </Text>
                    )}
                    <TabBarScreen navigation={navigation} setshowAccessDialog={setshowAccessDialog} />
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
        </CourseDetailProvider>
    );

    function courseInfo() {
        const title = detail?.title || courseCategory || courseName || "Bodhi Medicine";
        const rating = Number(courseRating) || detail?.rating || 0;
        const reviews = courseNumberOfRating || detail?.reviews_count || 0;

        return (
            <View>
                <Text style={{ ...Fonts.primaryColor16Regular }}>{courseCategory || detail?.category}</Text>
                <Text style={{ ...Fonts.primaryColor28Bold, color: 'white', marginVertical: Sizes.fixPadding }}>
                    {title}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ ...Fonts.primaryColor16Regular }}>
                            {rating.toFixed ? rating.toFixed(1) : rating}
                        </Text>
                        <MaterialIcons name="star" size={17} color={Colors.primaryColor} />
                        <Text style={{ ...Fonts.primaryColor16Regular }}>
                            ({reviews} Reviews)
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.push('takeCourse/takeCourseScreen',
                        {
                            courseName: courseName,
                            image: image,
                            courseId: courseId || detail?.id,
                        }
                    )}
                    style={styles.takeTheCourseContainerStyle}>
                    <Text style={{ ...Fonts.black17Bold }}>Tomar el curso</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.push('watchTrailer/watchTrailerScreen')}
                    style={styles.watchTrailerContainerStyle}>
                    <Text style={{ ...Fonts.black17Bold }}>Ver tráiler</Text>
                </TouchableOpacity>
            </View>
        )
    }
}

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
        alignItems: 'center', justifyContent: 'center', width: width - 40,
        borderRadius: Sizes.fixPadding - 5.0,
        marginTop: Sizes.fixPadding + 3.0,
        marginBottom: Sizes.fixPadding
    },
    watchTrailerContainerStyle: {
        backgroundColor: Colors.whiteColor,
        paddingVertical: Sizes.fixPadding + 2.0,
        alignItems: 'center',
        justifyContent: 'center',
        width: width - 40,
        borderRadius: Sizes.fixPadding - 5.0,
        marginBottom: Sizes.fixPadding - 5.0,
    },
    snackbarStyle: {
        position: 'absolute',
        left: -10.0,
        right: -10.0,
        bottom: -10.0,
        backgroundColor: '#333333',
    }
})

export default CourseDetailScreen;
