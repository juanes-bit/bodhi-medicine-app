import React, { useEffect, useMemo, useRef } from "react";
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { Colors, Fonts, Sizes, CommonStyles } from "../../../constant/styles";
import { MaterialIcons } from "@expo/vector-icons";
import Carousel from "react-native-snap-carousel-v4";
import CollapsingToolbar from "../../../component/sliverAppBar";
import { useNavigation, useRouter } from "expo-router";
import { useMyCoursesQuery, useProfileQuery } from "../../../src/hooks/useBodhiQueries";
import Skeleton from "../../../component/skeleton";

const placeholderCourseImage = require("../../../assets/images/new_course/new_course_4.png");

const width = Dimensions.get("window").width;
const itemWidth = Math.round(width * 0.8);

const carouselItems = [
  {
    image: require("../../../assets/images/new_course/new_course_5.png"),
    title: "Bodhi Medicine Training",
    subtitle: "Accede a los módulos grabados para una conexión profunda cuerpo-mente.",
  },
  {
    image: require("../../../assets/images/new_course/new_course_4.png"),
    title: "Programa HeartMath",
    subtitle: "Coherencia corazón-cerebro para equilibrar tu sistema nervioso.",
  },
  {
    image: require("../../../assets/images/new_course/new_course_2.png"),
    title: "Círculo Bodhi Medicine",
    subtitle: "Descubre prácticas conscientes para transformar tu salud diaria.",
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const flatListRef = useRef(null);

  const { data: profileData } = useProfileQuery({ retry: 1 });
  const {
    data: coursesData,
    isLoading: coursesLoading,
    isFetching: coursesFetching,
  } = useMyCoursesQuery({ retry: 1 });

  const items = coursesData?.items;
  const ownedItems = coursesData?.itemsOwned;

  const user = profileData ?? null;
  const allCourses = useMemo(
    () => (Array.isArray(items) ? items : []),
    [items],
  );
  const ownedCourses = useMemo(
    () => (Array.isArray(ownedItems) ? ownedItems : []),
    [ownedItems],
  );
  const popularCourses = useMemo(
    () => allCourses.filter((course) => !course.isOwned),
    [allCourses],
  );
  const coursesError = coursesData?.error ?? null;
  const shouldShowSkeleton = coursesLoading && !coursesData;
  const isRefreshing = coursesFetching && !shouldShowSkeleton;

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      flatListRef.current?.startAutoplay?.(false);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("blur", () => {
      flatListRef.current?.stopAutoplay?.();
    });
    return unsubscribe;
  }, [navigation]);

  const popularCoursesData = useMemo(() => {
    return popularCourses.length ? popularCourses : POPULAR_COURSES_FALLBACK;
  }, [popularCourses]);

  const firstName =
    typeof user?.name === "string" && user.name.trim()
      ? user.name.trim().split(/\s+/)[0]
      : null;

  return (
    <View style={{ flex: 1 }}>
      <CollapsingToolbar
        rightItem={
          <MaterialIcons
            name="notifications"
            size={25}
            color="black"
            onPress={() => navigation.push("notification/notificationScreen")}
          />
        }
        element={
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
            }}
          >
            <View>
              <Text style={{ ...Fonts.black25Bold, color: Colors.whiteColor }}>
                {firstName ? `Hola, ${firstName}` : "Inicio"}
              </Text>
              {shouldShowSkeleton ? (
                <Text style={{ ...Fonts.white15Regular, marginTop: 4 }}>
                  Cargando tus cursos...
                </Text>
              ) : null}
              {isRefreshing ? (
                <Text style={{ ...Fonts.white15Regular, marginTop: 4 }}>
                  Actualizando cursos...
                </Text>
              ) : null}
              {coursesError ? (
                <Text style={{ ...Fonts.white15Regular, marginTop: 4 }}>
                  {coursesError}
                </Text>
              ) : null}
            </View>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.push("accountSetting/accountSettingsScreen")}
            >
              <Image
                style={{
                  height: 80.0,
                  width: 80.0,
                  borderRadius: 40.0,
                  backgroundColor: Colors.whiteColor,
                  padding: Sizes.fixPadding / 2,
                }}
                source={require("../../../assets/images/Logo Hunter Price.png")}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        }
        toolbarColor={Colors.primaryColor}
        toolBarMinHeight={40}
        toolbarMaxHeight={230}
        src={require("../../../assets/images/appbar_bg.png")}
      >
        <View>
          {autoScroller()}
          {categories()}
          <View style={styles.sectionWrapper}>
            {title({ title: "Mis cursos" })}
            {renderOwnedCourses(ownedCourses)}
          </View>
          <View style={styles.sectionWrapper}>
            {title({ title: "Cursos populares" })}
            {renderPopularCourses(popularCoursesData)}
          </View>
          <View style={styles.sectionWrapper}>
            {title({ title: "Inscríbete" })}
            {instructors()}
          </View>
        </View>
      </CollapsingToolbar>
    </View>
  );

  function categories() {
    return (
      <View style={{ marginTop: Sizes.fixPadding * 2.0 }}>
        <View style={styles.continueWatchingContainer}>
          <View style={styles.continueHeader}>
            <Text style={styles.continueTitle}>Continuar viendo</Text>
            <TouchableOpacity activeOpacity={0.8}>
              <Text style={styles.continueSeeMore}>Ver más</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity activeOpacity={0.9} style={styles.continueCard}>
            <ImageBackground
              source={require("../../../assets/images/new_course/new_course_4.png")}
              style={styles.continueImage}
              imageStyle={styles.continueImageStyle}
            >
              <View style={styles.playButton}>
                <MaterialIcons name="play-arrow" size={28} color={Colors.primaryColor} />
              </View>
            </ImageBackground>
            <Text numberOfLines={1} style={styles.continueCourseTitle}>
              Tu recorrido en Bodhi Medicine
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function autoScroller() {
    const renderItem = ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.9}
        style={styles.heroCardWrapper}
      >
        <ImageBackground
          source={item.image}
          style={styles.heroImage}
          imageStyle={styles.heroImageStyle}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text numberOfLines={1} style={styles.heroTitle}>
              {item.title}
            </Text>
            <Text numberOfLines={2} style={styles.heroSubtitle}>
              {item.subtitle}
            </Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    );

    return (
      <Carousel
        ref={flatListRef}
        data={carouselItems}
        sliderWidth={width}
        itemWidth={itemWidth}
        renderItem={renderItem}
        autoplay
        containerCustomStyle={{ marginTop: Sizes.fixPadding * 3.0 }}
        contentContainerCustomStyle={{ paddingHorizontal: Sizes.fixPadding * 1.5 }}
        autoplayInterval={4000}
      />
    );
  }

  function renderCourseSkeletons(key) {
    return (
      <FlatList
        data={SKELETON_ITEMS}
        keyExtractor={(item) => `${key}-${item}`}
        renderItem={({ item }) => (
          <View style={styles.popularCoursesContainerStyle}>
            <Skeleton style={styles.popularCoursesImageStyle} />
            <View style={styles.popularCoursesInformationContainerStyle}>
              <Skeleton style={styles.courseSkeletonTitle} />
              <Skeleton style={styles.courseSkeletonSubtitle} />
            </View>
          </View>
        )}
        showsHorizontalScrollIndicator={false}
        horizontal
        contentContainerStyle={{
          paddingHorizontal: Sizes.fixPadding,
          paddingTop: Sizes.fixPadding * 2.0,
          paddingBottom: Sizes.fixPadding * 4.0,
        }}
      />
    );
  }

  function renderPopularCourses(list = []) {
    if (shouldShowSkeleton) {
      return renderCourseSkeletons("popular");
    }

    const arr =
      Array.isArray(list) && list.length ? list : POPULAR_COURSES_FALLBACK;

    if (!arr.length) {
      return <EmptyState text="Explora los cursos populares de Bodhi Medicine." />;
    }

    const renderItem = ({ item }) => {
      const handlePress = () => {
        const rawId = item?.id ?? item?.ID ?? item?.course_id ?? item?.courseId;
        if (!rawId) {
          Alert.alert("Bodhi Medicine", "Información del curso no disponible.");
          return;
        }

        router.push({
          pathname: "/courseDetail/courseDetailScreen",
          params: {
            courseId: String(rawId),
            title: item?.title ?? item?.name ?? "",
            image: item?.image ?? "",
            isOwned: String(
              Boolean(
                item?.isOwned ||
                  item?.is_owned ||
                  item?.owned ||
                  item?.access_granted ||
                  item?.access === "owned" ||
                  item?.access_status === "granted",
              ),
            ),
          },
        });
      };

      const isRemoteImage =
        typeof item.image === "string" && item.image.trim().length > 0;
      const cardImage = isRemoteImage
        ? { uri: item.image }
        : item.image || placeholderCourseImage;

      return (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
          style={styles.popularCoursesContainerStyle}
        >
          <ExpoImage
            source={cardImage}
            contentFit="cover"
            style={styles.popularCoursesImageStyle}
            transition={200}
            {...(isRemoteImage ? { cachePolicy: "memory-disk" } : {})}
          />
          <View style={styles.popularCoursesInformationContainerStyle}>
            <Text style={{ ...Fonts.gray15Regular }}>{item.title || "Curso"}</Text>
            {item.summary ? (
              <Text
                style={{ ...Fonts.black17Bold, marginVertical: Sizes.fixPadding - 5.0 }}
                numberOfLines={2}
              >
                {item.summary}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <FlatList
        data={arr}
        keyExtractor={(item, index) => `${item.id ?? index}`}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        horizontal
        contentContainerStyle={{
          paddingHorizontal: Sizes.fixPadding,
          paddingTop: Sizes.fixPadding * 2.0,
          paddingBottom: Sizes.fixPadding * 4.0,
        }}
      />
    );
  }

  function renderOwnedCourses(list = []) {
    if (shouldShowSkeleton) {
      return renderCourseSkeletons("owned");
    }

    const arr = Array.isArray(list) ? list : [];
    if (!arr.length) {
      return <EmptyState text="Aún no tienes cursos adquiridos." />;
    }

    const renderItem = ({ item }) => {
      const handlePress = () => {
        const rawId = item?.id ?? item?.ID ?? item?.course_id ?? item?.courseId;
        if (!rawId) {
          Alert.alert("Bodhi Medicine", "Información del curso no disponible.");
          return;
        }
        router.push({
          pathname: "/courseDetail/courseDetailScreen",
          params: {
            courseId: String(rawId),
            title: item?.title ?? item?.name ?? "",
            image: item?.image ?? "",
            isOwned: String(
              Boolean(
                item?.isOwned ||
                  item?.is_owned ||
                  item?.owned ||
                  item?.access_granted ||
                  item?.access === "owned" ||
                  item?.access_status === "granted",
              ),
            ),
          },
        });
      };

      const isRemoteImage =
        typeof item.image === "string" && item.image.trim().length > 0;
      const cardImage = isRemoteImage
        ? { uri: item.image }
        : item.image || placeholderCourseImage;

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          style={styles.popularCoursesContainerStyle}
        >
          <ExpoImage
            source={cardImage}
            contentFit="cover"
            style={styles.popularCoursesImageStyle}
            transition={200}
            {...(isRemoteImage ? { cachePolicy: "memory-disk" } : {})}
          />
          <View style={styles.popularCoursesInformationContainerStyle}>
            <View style={styles.cardHeader}>
              <Text
                style={{ ...Fonts.black17Bold, marginBottom: Sizes.fixPadding - 5.0 }}
                numberOfLines={2}
              >
                {item.title || "Curso"}
              </Text>
            </View>
            {item.summary ? (
              <Text
                style={{ ...Fonts.gray15Regular, marginBottom: Sizes.fixPadding - 5.0 }}
                numberOfLines={2}
              >
                {item.summary}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <FlatList
        data={arr}
        keyExtractor={(item, index) => `${item.id ?? index}`}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        horizontal
        contentContainerStyle={{
          paddingHorizontal: Sizes.fixPadding,
          paddingTop: Sizes.fixPadding * 2.0,
          paddingBottom: Sizes.fixPadding * 4.0,
        }}
      />
    );
  }


  function EmptyState({ text }) {
    return (
      <View
        style={{
          paddingHorizontal: Sizes.fixPadding * 2,
          paddingVertical: Sizes.fixPadding * 3,
        }}
      >
        <Text style={{ ...Fonts.gray16Regular }}>{text}</Text>
      </View>
    );
  }

  function instructors() {
    return (
      <View style={styles.subscribeContainer}>
        <Image
          source={require("../../../assets/images/Bodhi-Medicine-opt-in-300x300.jpeg")}
          style={styles.subscribeImage}
          resizeMode="cover"
        />
        <View style={styles.subscribeContent}>
          <Text style={{ ...Fonts.black17Bold }}>
            Los cursos de Bodhi Medicine te permiten entrar a un nuevo paradigma de la salud
          </Text>
          <Text style={{ ...Fonts.gray15Regular, marginTop: Sizes.fixPadding }}>
            Inscríbete a nuestra lista de emails y recibe por correo electrónico noticias, eventos, cursos e información sobre temas de salud.
          </Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.push("auth/signupScreen")}
            style={styles.subscribeButton}
          >
            <Text style={{ ...Fonts.white15Bold, marginRight: Sizes.fixPadding - 5.0 }}>
              Inscribirme
            </Text>
            <MaterialIcons name="chevron-right" size={22} color={Colors.whiteColor} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function title({ title }) {
    return <Text style={styles.sectionTitle}>{title}</Text>;
  }
};

const SKELETON_ITEMS = [0, 1, 2];

const POPULAR_COURSES_FALLBACK = [
  {
    id: 1,
    image: require("../../../assets/images/new_course/new_course_4.png"),
    title: "Masterclass para hombres sobre salud consciente, autonomía y amor propio.",
    summary: "Bodhi Medicine para Hombres",
    isOwned: false,
  },
  {
    id: 2,
    image: require("../../../assets/images/new_course/new_course_2.png"),
    title: "Coherencia corazón-cerebro para equilibrar el sistema nervioso.",
    summary: "HeartMath",
    isOwned: false,
  },
  {
    id: 3,
    image: require("../../../assets/images/new_course/bodhi_medicine_para_mamas.jpeg"),
    title: "Visión integral para cuidar tu salud y la de tu familia en 3 clases.",
    summary: "Bodhi Medicine para Mamás",
    isOwned: false,
  },
  {
    id: 4,
    image: require("../../../assets/images/new_course/menopausia_con_amor.jpeg"),
    title: "Taller de 5 horas para transitar la menopausia con herramientas claras.",
    summary: "La Menopausia con Amor",
    isOwned: false,
  },
];


const styles = StyleSheet.create({
  moduleItemContainer: {
    marginRight: Sizes.fixPadding * 1.5,
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding * 2.0,
    ...CommonStyles.shadow,
    padding: Sizes.fixPadding,
    alignItems: "center",
    width: 190,
  },
  moduleImageStyle: {
    height: 90,
    width: 90,
    borderRadius: Sizes.fixPadding * 2.0,
  },
  moduleTitleStyle: {
    ...Fonts.black17Bold,
    marginTop: Sizes.fixPadding,
  },
  moduleDatesStyle: {
    ...Fonts.gray15Regular,
    marginTop: Sizes.fixPadding / 2,
    textAlign: "center",
  },
  popularCoursesContainerStyle: {
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
  popularCoursesImageStyle: {
    height: 115.0,
    width: 115.0,
    borderRadius: Sizes.fixPadding * 2.0,
    marginLeft: Sizes.fixPadding,
  },
  popularCoursesInformationContainerStyle: {
    marginLeft: Sizes.fixPadding,
    width: width - 160,
    marginVertical: 3.0,
  },
  courseSkeletonTitle: {
    height: 18,
    width: width * 0.45,
    marginBottom: Sizes.fixPadding / 1.5,
    borderRadius: Sizes.fixPadding,
  },
  courseSkeletonSubtitle: {
    height: 14,
    width: width * 0.3,
    borderRadius: Sizes.fixPadding,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lockedBadge: {
    backgroundColor: '#d9534f',
    paddingHorizontal: Sizes.fixPadding - 4,
    paddingVertical: Sizes.fixPadding / 3,
    borderRadius: Sizes.fixPadding,
  },
  lockedBadgeText: {
    ...Fonts.white15Bold,
    fontSize: 11,
    color: Colors.whiteColor,
  },
  continueWatchingContainer: {
    marginTop: Sizes.fixPadding * 2.5,
    paddingHorizontal: Sizes.fixPadding * 2,
  },
  modulesListContainer: {
    paddingVertical: Sizes.fixPadding * 2,
    paddingHorizontal: Sizes.fixPadding * 1.5,
  },
  sectionWrapper: {
    marginTop: Sizes.fixPadding * 2.5,
    paddingHorizontal: Sizes.fixPadding * 2,
  },
  sectionTitle: {
    ...Fonts.indigoColor18Bold,
    marginBottom: Sizes.fixPadding,
    paddingHorizontal: 0,
  },
  heroCardWrapper: {
    width: itemWidth,
    marginHorizontal: Sizes.fixPadding,
    borderRadius: Sizes.fixPadding * 1.8,
    overflow: 'hidden',
    ...CommonStyles.shadow,
  },
  heroImage: {
    height: 210,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    borderRadius: Sizes.fixPadding * 1.8,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(78, 112, 166, 0.45)',
  },
  heroContent: {
    paddingHorizontal: Sizes.fixPadding * 1.5,
    paddingVertical: Sizes.fixPadding * 1.8,
  },
  heroTitle: {
    ...Fonts.white19Bold,
    fontSize: 22,
    marginBottom: Sizes.fixPadding / 2,
  },
  heroSubtitle: {
    ...Fonts.white15Regular,
    lineHeight: 20,
    opacity: 0.9,
  },
  continueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Sizes.fixPadding,
  },
  continueTitle: {
    ...Fonts.black19Bold,
    color: Colors.blackColor,
  },
  continueSeeMore: {
    ...Fonts.indigoColor14Bold,
    fontSize: 13,
    textTransform: 'uppercase',
  },
  continueCard: {
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding * 2,
    ...CommonStyles.shadow,
    padding: Sizes.fixPadding * 1.4,
    elevation: 3,
  },
  continueImage: {
    height: 165,
    borderRadius: Sizes.fixPadding * 1.8,
    marginBottom: Sizes.fixPadding,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueImageStyle: {
    borderRadius: Sizes.fixPadding * 1.8,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.whiteColor,
    alignItems: 'center',
    justifyContent: 'center',
    ...CommonStyles.shadow,
  },
  continueCourseTitle: {
    ...Fonts.gray16Regular,
    marginTop: Sizes.fixPadding / 2,
    paddingHorizontal: Sizes.fixPadding / 2,
  },
  subscribeContainer: {
    flexDirection: "row",
    backgroundColor: Colors.whiteColor,
    borderRadius: Sizes.fixPadding * 2.0,
    ...CommonStyles.shadow,
    margin: Sizes.fixPadding * 1.5,
    overflow: "hidden",
  },
  subscribeImage: {
    width: 120,
    height: 120,
  },
  subscribeContent: {
    flex: 1,
    padding: Sizes.fixPadding * 1.5,
  },
  subscribeButton: {
    marginTop: Sizes.fixPadding * 1.5,
    backgroundColor: Colors.primaryColor,
    paddingHorizontal: Sizes.fixPadding * 2.0,
    paddingVertical: Sizes.fixPadding,
    borderRadius: Sizes.fixPadding * 1.5,
    alignItems: "center",
    flexDirection: "row",
    alignSelf: "flex-start",
  },
  focusedTabWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFEACC",
    paddingHorizontal: Sizes.fixPadding + 5.0,
    paddingVertical: Sizes.fixPadding,
    borderRadius: Sizes.fixPadding * 4.0,
  },
  tabBarStyle: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: Colors.whiteColor,
    paddingHorizontal: Sizes.fixPadding,
    elevation: 5.0,
    shadowColor: Colors.blackColor,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.15,
    height: 65,
    alignItems: "center",
  },
  animatedView: {
    backgroundColor: "#333333",
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    borderRadius: Sizes.fixPadding * 2.0,
    paddingHorizontal: Sizes.fixPadding + 5.0,
    paddingVertical: Sizes.fixPadding,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default HomeScreen;
