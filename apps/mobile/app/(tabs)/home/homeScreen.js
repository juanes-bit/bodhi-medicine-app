import React, { useEffect, useRef } from "react";
import {
    Text,
    View,
    StyleSheet,
    Dimensions,
    ImageBackground,
    TouchableOpacity,
    FlatList,
    Image,
} from "react-native";
import { Colors, Fonts, Sizes, CommonStyles } from "../../../constant/styles";
import { MaterialIcons } from '@expo/vector-icons';
import Carousel from 'react-native-snap-carousel-v4';
import CollapsingToolbar from "../../../component/sliverAppBar";
import { useNavigation } from "expo-router";

const width = Dimensions.get('window').width;

const itemWidth = Math.round(width * 0.7);

const carouselItems = [
    {
        image: require('../../../assets/images/new_course/new_course_5.png'),
    },
    {
        image: require('../../../assets/images/new_course/new_course_4.png'),
    },
    {
        image: require('../../../assets/images/new_course/new_course_2.png'),
    },
];

const HomeScreen = () => {

    const navigation = useNavigation();

    const flatListRef = useRef();

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            flatListRef.current.startAutoplay((instantly = false));
        });
        return unsubscribe;
    }, [navigation]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('blur', () => {
            flatListRef.current.stopAutoplay();
        });
        return unsubscribe;
    }, [navigation]);

    return (
        <View style={{ flex: 1, }}>
            <CollapsingToolbar
                rightItem={
                    <MaterialIcons
                        name="notifications"
                        size={25}
                        color="black"
                        onPress={() => navigation.push('notification/notificationScreen')}
                    />
                }
                element={
                    <View
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            width: '100%',
                            alignItems: 'center'
                        }}
                    >
                        <Text style={{ ...Fonts.black25Bold, color: Colors.whiteColor }}>Inicio</Text>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => navigation.push('accountSetting/accountSettingsScreen')}
                        >
                            <Image
                                style={{ height: 80.0, width: 80.0, borderRadius: 40.0, backgroundColor: Colors.whiteColor, padding: Sizes.fixPadding / 2 }}
                                source={require('../../../assets/images/Logo Hunter Price.png')}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </View>
                }
                toolbarColor={Colors.primaryColor}
                toolBarMinHeight={40}
                toolbarMaxHeight={230}
                src={require('../../../assets/images/appbar_bg.png')}
            >
                <View>
                    {autoScroller()}
                    {categories()}
                    {title({ title: 'Cursos Populares' })}
                    {popularCourses()}
                    {title({ title: 'Cursos Nuevos' })}
                    {newCourses()}
                    {title({ title: 'Inscríbete' })}
                    {instructors()}
                </View>
            </CollapsingToolbar>
        </View>
    )

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
        )

        return (
            <View style={{ marginTop: Sizes.fixPadding * 3.0 }}>
                {title({ title: 'Fechas de los módulos de la formación BM 2026' })}
                <FlatList
                    data={modulesList}
                    keyExtractor={(item) => `${item.id}`}
                    renderItem={renderItem}
                    showsHorizontalScrollIndicator={false}
                    horizontal={true}
                    contentContainerStyle={{
                        paddingVertical: Sizes.fixPadding * 2.0,
                    }}
                />
            </View>
        )
    }

    function autoScroller() {
        const renderItem = ({ item }) => (
            <ImageBackground
                source={item.image}
                style={{
                    width: itemWidth - 10,
                    height: 200,
                    alignItems: "center",
                    justifyContent: 'center',
                    paddingHorizontal: Sizes.fixPadding
                }}
                borderRadius={Sizes.fixPadding - 5.0}
            >
                <Text numberOfLines={1} style={{ ...Fonts.white25Bold }}>
                    Bodhi Medicine Training 2026
                </Text>
                <Text numberOfLines={2} style={{ ...Fonts.white15Regular, textAlign: 'center' }}>
                    Access the 5 recorded modules for a deep connection between body and mind.
                </Text>
            </ImageBackground>
        )

        return (
            <Carousel
                ref={flatListRef}
                data={carouselItems}
                sliderWidth={width}
                itemWidth={itemWidth}                
                renderItem={renderItem}
                autoplay={true}
                containerCustomStyle={{ marginTop: Sizes.fixPadding * 4.0 }}
                autoplayInterval={4000}
            />
        );
    }

    function popularCourses() {
        const renderItem = ({ item }) => (
            <TouchableOpacity
                onPress={() => navigation.push('courseDetail/courseDetailScreen',
                    {
                        image: item.image,
                        courseName: item.courseName,
                        courseCategory: item.courseCategory,
                        courseRating: item.courseRating,
                        courseNumberOfRating: item.courseNumberOfRating,
                        courseId: item.courseId,
                    }
                )}
                activeOpacity={0.9}
                style={styles.popularCoursesContainerStyle}>
                <Image
                    source={item.image}
                    resizeMode="cover"
                    style={styles.popularCoursesImageStyle}
                />
                <View style={styles.popularCoursesInformationContainerStyle}>
                    <Text style={{ ...Fonts.gray15Regular }}>
                        {item.courseName}
                    </Text>
                    <Text style={{ ...Fonts.black17Bold, marginVertical: Sizes.fixPadding - 5.0 }}>
                        {item.courseCategory}
                    </Text>
                    <View style={{ backgroundColor: 'gray', height: 0.2, }}></View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Sizes.fixPadding - 5.0 }}>
                        <Text style={{ ...Fonts.black15Bold }}>{item.courseRating}</Text>
                        <MaterialIcons name="star" size={17} color="black" />
                        <Text style={{ ...Fonts.black15Bold, marginLeft: Sizes.fixPadding - 5.0 }}>
                            ({item.courseNumberOfRating})
                        </Text>
                    </View>
                    <View style={{ marginTop: Sizes.fixPadding }} />
                </View>
            </TouchableOpacity>
        )

        return (
            <FlatList
                data={popularCoursesList}
                keyExtractor={(item) => `${item.courseId}`}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                horizontal={true}
                contentContainerStyle={{
                    paddingHorizontal: Sizes.fixPadding,
                    paddingTop: Sizes.fixPadding * 2.0,
                    paddingBottom: Sizes.fixPadding * 4.0
                }}
            />
        )
    }

    function newCourses() {
        const renderItem = ({ item }) => (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.push('courseDetail/courseDetailScreen',
                    {
                        image: item.image,
                        courseName: item.courseName,
                        courseCategory: item.courseCategory,
                        courseRating: item.courseRating,
                        courseNumberOfRating: item.courseNumberOfRating,
                        coursePrice: item.coursePrice,
                        courseId: item.courseId,
                    }
                )}
                style={styles.popularCoursesContainerStyle}>
                <Image
                    source={item.image}
                    resizeMode="cover"
                    style={styles.popularCoursesImageStyle}
                />
                <View style={styles.popularCoursesInformationContainerStyle}>
                    <Text style={{ ...Fonts.gray15Regular }}>
                        {item.courseName}
                    </Text>
                    <Text style={{ ...Fonts.black17Bold, marginVertical: Sizes.fixPadding - 5.0 }}>
                        {item.courseCategory}
                    </Text>
                    <View style={{ backgroundColor: 'gray', height: 0.2, }}></View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Sizes.fixPadding - 5.0 }}>
                        <Text style={{ ...Fonts.black15Bold }}>{item.courseRating}</Text>
                        <MaterialIcons name="star" size={17} color="black" />
                        <Text style={{ ...Fonts.black15Bold, marginLeft: Sizes.fixPadding - 5.0 }}>
                            ({item.courseNumberOfRating})
                        </Text>
                    </View>
                    <Text style={{ ...Fonts.black19Bold, marginTop: Sizes.fixPadding }}>
                        ${item.coursePrice}
                    </Text>
                </View>
            </TouchableOpacity>
        )

        return (
            <FlatList
                data={newCoursesList}
                keyExtractor={(item) => `${item.courseId}`}
                renderItem={renderItem}
                showsHorizontalScrollIndicator={false}
                horizontal={true}
                contentContainerStyle={{
                    paddingHorizontal: Sizes.fixPadding,
                    paddingTop: Sizes.fixPadding * 2.0,
                    paddingBottom: Sizes.fixPadding * 4.0
                }}
            />
        )
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
                        onPress={() => navigation.push('auth/signupScreen')}
                        style={styles.subscribeButton}
                    >
                        <Text style={{ ...Fonts.white15Bold, marginRight: Sizes.fixPadding - 5.0 }}>
                            Inscribirme
                        </Text>
                        <MaterialIcons name="chevron-right" size={22} color={Colors.whiteColor} />
                    </TouchableOpacity>
                </View>
            </View>
        )
    }
}

const modulesList = [
    {
        id: '1',
        moduleTitle: 'Módulo 1',
        dates: '23, 24 y 25 de enero',
        image: require('../../../assets/images/MODULO-1_Mesa-de-trabajo-1-300x300.png'),
    },
    {
        id: '2',
        moduleTitle: 'Módulo 2',
        dates: '13, 14 y 15 de febrero',
        image: require('../../../assets/images/MODULO-2_Mesa-de-trabajo-1-300x300.png'),
    },
    {
        id: '3',
        moduleTitle: 'Módulo 3',
        dates: '13, 14 y 15 de marzo',
        image: require('../../../assets/images/MODULO-3_Mesa-de-trabajo-1-300x300.png'),
    },
    {
        id: '4',
        moduleTitle: 'Módulo 4',
        dates: '10, 11 y 12 de abril',
        image: require('../../../assets/images/MODULO-4_Mesa-de-trabajo-1-300x300.png'),
    },
    {
        id: '5',
        moduleTitle: 'Módulo 5',
        dates: '1, 2 y 3 de mayo',
        image: require('../../../assets/images/MODULO-5_Mesa-de-trabajo-1-300x300.png'),
    }
];

const popularCoursesList = [
    {
        courseId: 1,
        image: require("../../../assets/images/new_course/new_course_4.png"),
        courseName: "Masterclass para hombres sobre salud consciente, autonomía y amor propio.",
        courseCategory: "Bodhi Medicine para Hombres",
        courseRating: "5.0",
        courseNumberOfRating: "128"
    },
    {
        courseId: 2,
        image: require("../../../assets/images/new_course/new_course_2.png"),
        courseName: "Coherencia corazón-cerebro para equilibrar el sistema nervioso.",
        courseCategory: "HeartMath",
        courseRating: "4.9",
        courseNumberOfRating: "95"
    },
    {
        courseId: 3,
        image: require("../../../assets/images/new_course/bodhi_medicine_para_mamas.jpeg"),
        courseName: "Visión integral para cuidar tu salud y la de tu familia en 3 clases.",
        courseCategory: "Bodhi Medicine para Mamás",
        courseRating: "5.0",
        courseNumberOfRating: "142"
    },
    {
        courseId: 4,
        image: require("../../../assets/images/new_course/menopausia_con_amor.jpeg"),
        courseName: "Taller de 5 horas para transitar la menopausia con herramientas claras.",
        courseCategory: "La Menopausia con Amor",
        courseRating: "4.8",
        courseNumberOfRating: "87"
    },
];

const newCoursesList = [
    {
        courseId: 1,
        image: require("../../../assets/images/new_course/new_course_4.png"),
        courseName: "Masterclass para hombres sobre salud consciente, autonomía y amor propio.",
        courseCategory: "Bodhi Medicine para Hombres",
        courseRating: "4.0",
        courseNumberOfRating: "5",
        coursePrice: "59"
    },
    {
        courseId: 2,
        image: require("../../../assets/images/new_course/new_course_2.png"),
        courseName: "Coherencia corazón-cerebro para equilibrar el sistema nervioso.",
        courseCategory: "HeartMath",
        courseRating: "4.5",
        courseNumberOfRating: "7",
        coursePrice: "64"
    },
    {
        courseId: 3,
        image: require("../../../assets/images/new_course/bodhi_medicine_para_mamas.jpeg"),
        courseName: "Visión integral para cuidar tu salud y la de tu familia en 3 clases.",
        courseCategory: "Bodhi Medicine para Mamás",
        courseRating: "4.0",
        courseNumberOfRating: "4",
        coursePrice: "49"
    },
    {
        courseId: 4,
        image: require("../../../assets/images/new_course/menopausia_con_amor.jpeg"),
        courseName: "Taller de 5 horas para transitar la menopausia con herramientas claras.",
        courseCategory: "La Menopausia con Amor",
        courseRating: "4.8",
        courseNumberOfRating: "9",
        coursePrice: "59"
    }
]

function title({ title }) {
    return (
        <View style={{ marginHorizontal: Sizes.fixPadding }}>
            <Text style={{ ...Fonts.black20Bold }}>{title}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    moduleItemContainer: {
        width: 140.0,
        alignItems: 'center',
        marginHorizontal: Sizes.fixPadding,
    },
    moduleImageStyle: {
        width: 120.0,
        height: 120.0,
        borderRadius: 60.0,
        borderWidth: 2,
        borderColor: 'rgba(130, 79, 100, 0.25)',
        backgroundColor: Colors.whiteColor,
    },
    moduleTitleStyle: {
        ...Fonts.black17Bold,
        color: Colors.primaryColor,
        marginTop: Sizes.fixPadding,
        textAlign: 'center'
    },
    moduleDatesStyle: {
        ...Fonts.gray15Regular,
        textAlign: 'center',
        marginTop: Sizes.fixPadding - 5.0
    },
    popularCoursesContainerStyle: {
        elevation: 1.0,
        width: 220.0,
        borderRadius: Sizes.fixPadding * 2.0,
        backgroundColor: Colors.whiteColor,
        marginRight: Sizes.fixPadding * 2.0,
        ...CommonStyles.shadow
    },
    popularCoursesImageStyle: {
        width: 220.0,
        height: 150.0,
        borderTopRightRadius: Sizes.fixPadding * 2.0,
        borderTopLeftRadius: Sizes.fixPadding * 2.0
    },
    popularCoursesInformationContainerStyle: {
        paddingHorizontal: Sizes.fixPadding,
        paddingTop: Sizes.fixPadding,
        paddingBottom: Sizes.fixPadding * 2.0
    },
    subscribeContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.whiteColor,
        marginHorizontal: Sizes.fixPadding,
        marginTop: Sizes.fixPadding * 2.0,
        marginBottom: Sizes.fixPadding * 4.0,
        borderRadius: Sizes.fixPadding * 2.0,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        overflow: 'hidden',
        ...CommonStyles.shadow
    },
    subscribeImage: {
        width: 130,
        height: 130
    },
    subscribeContent: {
        flex: 1,
        paddingHorizontal: Sizes.fixPadding * 1.5,
        paddingVertical: Sizes.fixPadding * 1.5,
        justifyContent: 'center'
    },
    subscribeButton: {
        marginTop: Sizes.fixPadding * 1.5,
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryColor,
        paddingHorizontal: Sizes.fixPadding * 1.5,
        paddingVertical: Sizes.fixPadding - 2.0,
        borderRadius: Sizes.fixPadding * 1.5
    }
});

export default HomeScreen;
