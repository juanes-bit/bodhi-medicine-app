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
import { listMyCourses, me } from "../../../src/_core/bodhi";

const width = Dimensions.get("window").width;
const itemWidth = Math.round(width * 0.7);

const carouselItems = [
  {
    image: require("../../../assets/images/new_course/new_course_5.png"),
  },
  {
    image: require("../../../assets/images/new_course/new_course_4.png"),
  },
  {
    image: require("../../../assets/images/new_course/new_course_2.png"),
  },
];

const HomeScreen = () => {
  const navigation = useNavigation();
  const flatListRef = useRef(null);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [owned, setOwned] = useState([]);
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
    let cancelled = false;
    (async () => {
      try {
        const profile = await me().catch(() => null);
        if (cancelled) {
          return;
        }
        if (profile) {
          setUser(profile);
        }

        const res = await listMyCourses({ profile }).catch(() => ({ items: [] }));
        if (cancelled) return;

        const all = Array.isArray(res?.items) ? res.items : [];
        const mine = all.filter((item) => item?.isOwned);

        if (__DEV__) {
          console.log('[home] total=', all.length, 'owned=', mine.length,
            all.slice(0, 5).map((x) => ({ id: x.id, access: x.access, isOwned: x.isOwned, r: x._debug_access_reason })),
          );
        }

        setItems(all);
        setOwned(mine);
      } catch (error) {
        if (!cancelled) {
          setCoursesError(String(error?.message || error));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  
  

  const popularCoursesData = useMemo(() => {
    if (items.length) {
      const locked = items.filter((item) => !item?.isOwned);
      if (locked.length) return locked;
      return items;
    }
    return POPULAR_COURSES_FALLBACK;
  }, [items]);

  const acquiredItems = owned.length ? owned : items;
  const acquiredSectionTitle = owned.length ? "Cursos adquiridos" : "Mis cursos";

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
          {title({ title: "Cursos Populares" })}
          {popularCourses(popularCoursesData)}
          {title({ title: acquiredSectionTitle })}
          {acquiredCourses(acquiredItems)}
          {title({ title: "Inscríbete" })}
          {instructors()}
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
      <View style={{ marginTop: Sizes.fixPadding * 3.0 }}>
        {title({ title: "Fechas de los módulos de la formación BM 2026" })}
        <FlatList
          data={modulesList}
          keyExtractor={(item) => `${item.id}`}
          renderItem={renderItem}
          showsHorizontalScrollIndicator={false}
          horizontal
          contentContainerStyle={{
            paddingVertical: Sizes.fixPadding * 2.0,
          }}
        />
      </View>
    );
  }

  function autoScroller() {
    const renderItem = ({ item }) => (
      <ImageBackground
        source={item.image}
        style={{
          width: itemWidth - 10,
          height: 200,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: Sizes.fixPadding,
        }}
        borderRadius={Sizes.fixPadding - 5.0}
      >
        <Text numberOfLines={1} style={{ ...Fonts.white25Bold }}>
          Bodhi Medicine Training 2026
        </Text>
        <Text
          numberOfLines={2}
          style={{ ...Fonts.white15Regular, textAlign: "center" }}
        >
          Access the 5 recorded modules for a deep connection between body and mind.
        </Text>
      </ImageBackground>
    );

    return (
      <Carousel
        ref={flatListRef}
        data={carouselItems}
        sliderWidth={width}
        itemWidth={itemWidth}
        renderItem={renderItem}
        autoplay
        containerCustomStyle={{ marginTop: Sizes.fixPadding * 4.0 }}
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
        if (!item?.isOwned) {
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
                ({item.courseNumberOfRating})
              </Text>
            </View>
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
    if (!arr.length) {
      return <EmptyState text="Aún no tienes cursos adquiridos." />;
    }

    const renderItem = ({ item }) => {
      const handlePress = () => {
        if (!item?.isOwned) {
          Alert.alert("Bodhi Medicine", "Aún no tienes acceso a este curso.");
          return;
        }
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
              {!item.isOwned ? (
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>Bloqueado</Text>
                </View>
              ) : null}
            </View>
            <Text
              style={{ ...Fonts.gray15Regular, marginBottom: Sizes.fixPadding - 5.0 }}
              numberOfLines={2}
            >
              {item.courseName}
            </Text>
            <View style={{ backgroundColor: "gray", height: 0.2 }} />
            <View
              style={{ flexDirection: "row", alignItems: "center", marginTop: Sizes.fixPadding - 5.0 }}
            >
              <Text style={{ ...Fonts.black15Bold }}>{item.courseRating}</Text>
              <MaterialIcons name="star" size={17} color="black" style={{ marginLeft: 4 }} />
              <Text
                style={{ ...Fonts.black15Bold, marginLeft: Sizes.fixPadding - 5.0 }}
              >
                ({item.courseNumberOfRating})
              </Text>
            </View>
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
    return <Text style={{ ...Fonts.indigoColor18Bold }}>{title}</Text>;
  }
};

const modulesList = [
  {
    id: "1",
    moduleTitle: "Módulo 1",
    dates: "23, 24 y 25 de enero",
    image: require("../../../assets/images/MODULO-1_Mesa-de-trabajo-1-300x300.png"),
  },
  {
    id: "2",
    moduleTitle: "Módulo 2",
    dates: "13, 14 y 15 de febrero",
    image: require("../../../assets/images/MODULO-2_Mesa-de-trabajo-1-300x300.png"),
  },
  {
    id: "3",
    moduleTitle: "Módulo 3",
    dates: "13, 14 y 15 de marzo",
    image: require("../../../assets/images/MODULO-3_Mesa-de-trabajo-1-300x300.png"),
  },
  {
    id: "4",
    moduleTitle: "Módulo 4",
    dates: "10, 11 y 12 de abril",
    image: require("../../../assets/images/MODULO-4_Mesa-de-trabajo-1-300x300.png"),
  },
  {
    id: "5",
    moduleTitle: "Módulo 5",
    dates: "1, 2 y 3 de mayo",
    image: require("../../../assets/images/MODULO-5_Mesa-de-trabajo-1-300x300.png"),
  },
];

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
