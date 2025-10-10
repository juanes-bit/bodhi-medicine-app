import React from "react";
import { ImageBackground, Text, View, FlatList, ScrollView, StyleSheet } from "react-native";
import { Fonts, Sizes } from "../../constant/styles";
import { MaterialIcons } from '@expo/vector-icons';

const learnFromCourseList = [
    {
        id: '1',
        image: require("../../assets/images/new_course/new_course_1.png"),
        typeOfLearn: 'Full Language',
    },
    {
        id: '2',
        image: require("../../assets/images/new_course/new_course_2.png"),
        typeOfLearn: 'Practicals',
    },
    {
        id: '3',
        image: require("../../assets/images/new_course/new_course_1.png"),
        typeOfLearn: 'Full Language',
    },
    {
        id: '4',
        image: require("../../assets/images/new_course/new_course_1.png"),
        typeOfLearn: 'Full Language',
    },
]

const CourseOverViewScreen = () => {
    return (
        <View style={styles.container}>
            <ScrollView
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
            >
                {dummyText()}
                {divider()}
                {title({ title: 'Que obtendras' })}
                {getFromCourseInfo({
                    iconName: "menu",
                    availability: '15 lecciones en video'
                })}
                {getFromCourseInfo({
                    iconName: 'star-border',
                    availability: 'Materiales de aprendizaje exclusivos'
                })}
                {getFromCourseInfo({
                    iconName: "check",
                    availability: '100% garantizado'
                })}
                {divider()}
                {title({ title: 'What you will learn' })}
                {learnFromCourse()}
            </ScrollView>
        </View>
    );

    function learnFromCourse() {
        const renderItem = ({ item }) => (
            <ImageBackground
                source={item.image}
                style={{ height: 190.0, width: 190.0, marginRight: Sizes.fixPadding }}
                borderRadius={Sizes.fixPadding * 2.0}
                resizeMode="cover"
            >
                <View style={styles.learnFromImageBlurContainerStyle}>
                    <Text style={{ ...Fonts.primaryColor23Bold }}>
                        {item.typeOfLearn}
                    </Text>
                </View>
            </ImageBackground>
        )

        return (
            <FlatList
                data={learnFromCourseList}
                keyExtractor={(item) => `${item.id}`}
                renderItem={renderItem}
                horizontal
                contentContainerStyle={{ paddingVertical: Sizes.fixPadding * 2.0, }}
            />
        )
    }

    function getFromCourseInfo({ iconName, availability }) {
        return (
            <View style={styles.getFromCourseInfoContainerStyle}>
                <MaterialIcons name={iconName} size={24} color="black" />
                <Text style={{ ...Fonts.black17Bold, marginLeft: Sizes.fixPadding * 2.0 }}>
                    {availability}
                </Text>
            </View>
        )
    }

    function title({ title }) {
        return (
            <Text style={{ ...Fonts.indigoColor18Bold }}>{title}</Text>
        )
    }

    function divider() {
        return (
            <View style={{
                backgroundColor: '#E1E1E1',
                height: 2.0,
                marginVertical: Sizes.fixPadding + 5.0
            }}>
            </View>
        )
    }

    function dummyText() {
        return (
            <View>
                <Text style={{ ...Fonts.indigoColor18Bold, marginTop: Sizes.fixPadding * 4.0 }}>
                    Bodhi Medicine para Hombres
                </Text>
                <Text style={{ ...Fonts.gray16Regular, marginTop: Sizes.fixPadding }}>
                    Bodhi Medicine para Hombres
                </Text>
                <Text style={{ ...Fonts.gray16Regular, marginTop: Sizes.fixPadding + 5.0 }}>
                    Una masterclass exclusiva para hombres donde abrimos la puerta hacia el nuevo paradigma de salud, libre de miedo y dependencia en la figura de autoridad y llena de empoderamiento, auto-sustentabilidad y amor propio. En este curso aprenderas la sabiduria de nuestra biologia, nuestro instinto de supervivencia y el potencial de ser conscientes de ellos.
                </Text>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    learnFromImageBlurContainerStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.30)',
        height: 190.0, width: 190.0,
        borderRadius: Sizes.fixPadding * 2.0,
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        paddingVertical: Sizes.fixPadding,
        paddingHorizontal: Sizes.fixPadding
    },
    getFromCourseInfoContainerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Sizes.fixPadding,
        marginHorizontal: Sizes.fixPadding + 5.0
    },
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: Sizes.fixPadding,
    }
})

export default CourseOverViewScreen;
