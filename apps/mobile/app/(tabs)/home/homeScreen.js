import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { Colors, Fonts, Sizes, CommonStyles } from "../../../constant/styles";
import { MaterialIcons } from "@expo/vector-icons";
import Carousel from "react-native-snap-carousel-v4";
import CollapsingToolbar from "../../../component/sliverAppBar";
import { useNavigation } from "expo-router";
import { listMyCourses, me, normalizeOwned } from "../../../src/_core/bodhi";

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
  const flatListRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [owned, setOwned] = useState(0);
  const [coursesError, setCoursesError] = useState(null);

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

  useEffect(() => {
    let isMounted = true;

    (async () => {
      if (!isMounted) return;

      setLoading(true);

      try {
        const profile = await me().catch(() => null);
        if (isMounted && profile) {
          setUser(profile);
        }

        const {
          items: normalizedItems = [],
          itemsOwned = [],
          total = 0,
          owned = 0,
        } = await listMyCourses(); // items ya vienen con .isOwned normalizado e id estable
        if (!isMounted) return;

        if (__DEV__) {
          console.log('[home] courses', { total, owned });
        }

        setItems(normalizedItems);
        setOwnedItems(itemsOwned);
        setOwned(owned);
        setCoursesError(null);
      } catch (error) {
        if (__DEV__) {
          console.log('[home] list error', error);
        }
        if (isMounted) {
          setCoursesError(String(error?.message || error));
          setItems([]);
          setOwnedItems([]);
          setOwned(0);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  
  

  const popularCoursesData = useMemo(() => {
    return items.length ? items : POPULAR_COURSES_FALLBACK;
  }, [items]);

  const acquiredItems = ownedItems;
  const acquiredSectionTitle = "Mis cursos";

  const firstName =
    typeof user?.name === "string" && user.name.trim()
      ? user.name.trim().split(/\s+/)[0]
      : null;

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ ...Fonts.white15Regular }}>Cargando tus cursos...</Text>
      </View>
    );
  }

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
      {loading ? (
        <Text style={{ ...Fonts.white15Regular, marginTop: 4 }}>
          Cargando tus cursos...
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
            {acquiredCourses(acquiredItems)}
          </View>
          <View style={styles.sectionWrapper}>
            {title({ title: "Cursos populares" })}
            {popularCourses(popularCoursesData)}
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
    const renderItem = ({ item }) => (
      <View style={styles.moduleItemContainer}>
        <Image
          source={item.image}
          style={styles.moduleImageStyle}
          resizeMode="cover"
        />
        <Text style={styles.moduleTitleStyle}>{item.moduleTitle}</Text>
        <Text style={styles.moduleDatesStyle}>{item.dates}</Text>
      </View>
    );

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

  function popularCourses(list = []) {
    const arr = Array.isArray(list) ? list : [];
    if (!arr.length) {
      return null;
    }

    const renderItem = ({ item }) => {
      const handlePress = () => {
        if (!Boolean(item?.isOwned)) {
          Alert.alert("Bodhi Medicine", "Aún no tienes acceso a este curso.");
          return;
        }
        navigation.push("courseDetail/courseDetailScreen", {
          image: item.image,
          courseName: item.courseName,
          courseCategory: item.courseCategory,
          courseRating: item.courseRating,
          courseNumberOfRating: item.courseNumberOfRating,
          courseId: item.courseId,
        });
      };

      const ratingCount = Number(item.courseNumberOfRating ?? 0);
      const showRating = Number.isFinite(ratingCount) && ratingCount > 0;

      return (
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
          style={styles.popularCoursesContainerStyle}
        >
          <Image
            source={item.image}
            resizeMode="cover"
            style={styles.popularCoursesImageStyle}
          />
          <View style={styles.popularCoursesInformationContainerStyle}>
            <Text style={{ ...Fonts.gray15Regular }}>{item.courseName}</Text>
            <Text
              style={{ ...Fonts.black17Bold, marginVertical: Sizes.fixPadding - 5.0 }}
            >
              {item.courseCategory}
            </Text>
            <View style={{ backgroundColor: "gray", height: 0.2 }} />
            {showRating ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", marginTop: Sizes.fixPadding - 5.0 }}
              >
                <Text style={{ ...Fonts.black15Bold }}>
                  {item.courseRating}
                </Text>
                <MaterialIcons name="star" size={17} color="black" />
                <Text
                  style={{ ...Fonts.black15Bold, marginLeft: Sizes.fixPadding - 5.0 }}
                >
                  ({ratingCount})
                </Text>
              </View>
            ) : null}
            <View style={{ marginTop: Sizes.fixPadding }} />
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <FlatList
        data={arr}
        keyExtractor={(item, index) => `${item.courseId ?? index}`}
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

  function acquiredCourses(list = []) {
    const arr = Array.isArray(list) ? list : [];
    if (owned === 0) {
      return <EmptyState text="Aún no tienes cursos adquiridos." />;
    }
    if (!arr.length) {
      return null;
    }

    const renderItem = ({ item }) => {
      const handlePress = () => {
        navigation.push("courseDetail/courseDetailScreen", {
          image: item.image,
          courseName: item.courseName,
          courseCategory: item.courseCategory,
          courseRating: item.courseRating,
          courseNumberOfRating: item.courseNumberOfRating,
          coursePrice: item.coursePrice,
          courseId: item.courseId,
        });
      };

      const ratingCount = Number(item.courseNumberOfRating ?? 0);
      const showRating = Number.isFinite(ratingCount) && ratingCount > 0;

      return (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handlePress}
          style={styles.popularCoursesContainerStyle}
        >
          <Image
            source={item.image}
            resizeMode="cover"
            style={styles.popularCoursesImageStyle}
          />
          <View style={styles.popularCoursesInformationContainerStyle}>
            <View style={styles.cardHeader}>
              <Text
                style={{ ...Fonts.black17Bold, marginBottom: Sizes.fixPadding - 5.0 }}
                numberOfLines={2}
              >
                {item.courseCategory}
              </Text>
            </View>
            <Text
              style={{ ...Fonts.gray15Regular, marginBottom: Sizes.fixPadding - 5.0 }}
              numberOfLines={2}
            >
              {item.courseName}
            </Text>
            <View style={{ backgroundColor: "gray", height: 0.2 }} />
            {showRating ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", marginTop: Sizes.fixPadding - 5.0 }}
              >
                <Text style={{ ...Fonts.black15Bold }}>{item.courseRating}</Text>
                <MaterialIcons name="star" size={17} color="black" style={{ marginLeft: 4 }} />
                <Text
                  style={{ ...Fonts.black15Bold, marginLeft: Sizes.fixPadding - 5.0 }}
                >
                  ({ratingCount})
                </Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>
      );
    };

    return (
      <FlatList
        data={arr}
        keyExtractor={(item, index) => `${item.courseId ?? index}`}
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

const modulesList = [];

const POPULAR_COURSES_FALLBACK = [
  {
    courseId: 1,
    image: require("../../../assets/images/new_course/new_course_4.png"),
    courseName: "Masterclass para hombres sobre salud consciente, autonomía y amor propio.",
    courseCategory: "Bodhi Medicine para Hombres",
    courseRating: "5.0",
    courseNumberOfRating: "128",
  },
  {
    courseId: 2,
    image: require("../../../assets/images/new_course/new_course_2.png"),
    courseName: "Coherencia corazón-cerebro para equilibrar el sistema nervioso.",
    courseCategory: "HeartMath",
    courseRating: "4.9",
    courseNumberOfRating: "95",
  },
  {
    courseId: 3,
    image: require("../../../assets/images/new_course/bodhi_medicine_para_mamas.jpeg"),
    courseName: "Visión integral para cuidar tu salud y la de tu familia en 3 clases.",
    courseCategory: "Bodhi Medicine para Mamás",
    courseRating: "5.0",
    courseNumberOfRating: "142",
  },
  {
    courseId: 4,
    image: require("../../../assets/images/new_course/menopausia_con_amor.jpeg"),
    courseName: "Taller de 5 horas para transitar la menopausia con herramientas claras.",
    courseCategory: "La Menopausia con Amor",
    courseRating: "4.8",
    courseNumberOfRating: "87",
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
