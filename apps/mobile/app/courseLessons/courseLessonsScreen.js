import React from "react";
import { Text, View, StyleSheet, Dimensions, Image, ScrollView, TouchableOpacity } from "react-native";
import { Fonts, Sizes } from "../../constant/styles";
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from "expo-router";

const { width } = Dimensions.get('screen');

const courseLessonsList = [
    {
        id: '1',
        image: require('../../assets/images/new_course/new_course_1.png'),
        title: 'Trailer',
        descritption: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry',
        isLoack: false,
    },
    {
        id: '2',
        image: require('../../assets/images/new_course/new_course_2.png'),
        title: 'Lesson 1',
        descritption: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry',
        isLoack: true,
    },
    {
        id: '3',
        image: require('../../assets/images/new_course/new_course_3.png'),
        title: 'Lesson 2',
        descritption: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry',
        isLoack: true,
    },
    {
        id: '4',
        image: require('../../assets/images/new_course/new_course_4.png'),
        title: 'Lesson 3',
        descritption: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry',
        isLoack: true,
    },
    {
        id: '5',
        image: require('../../assets/images/new_course/new_course_5.png'),
        title: 'Lesson 4',
        descritption: 'Lorem Ipsum is simply dummy text of the printing and typesetting industry',
        isLoack: false,
    }
];

const CoursesLessonsScreen = ({ setshowAccessDialog }) => {

    const navigation = useNavigation();

    return (
        <View style={{ backgroundColor: '#FAFAFA', flex: 1, }}>
            <View style={{ flex: 1 }}>
                <ScrollView
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: Sizes.fixPadding * 2.0 }}
                >
                    {
                        courseLessonsList.map(item => (
                            renderItem({ item })
                        ))
                    }
                </ScrollView>
            </View>
        </View>
    )

    function renderItem({ item }) {
        return (
            <View key={item.id}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => {
                        if (item.isLoack) {
                            setshowAccessDialog(true)
                            setTimeout(() => {
                                setshowAccessDialog(false)
                            }, 1000);
                        }
                        else {
                            navigation.push('watchTrailer/watchTrailerScreen')
                        }
                    }}
                    style={styles.lessonInfoContainerStyle}>
                    <Image
                        source={item.image}
                        style={styles.lessonInfoImageStyle}
                        resizeMode="cover"
                    />
                    <View style={{
                        marginLeft: Sizes.fixPadding,
                        width: width - 140,
                        marginVertical: 3.0,
                    }}>
                        <Text style={{ ...Fonts.black17Bold }}>
                            {item.title}
                        </Text>
                        <Text style={{ ...Fonts.gray16Regular, marginVertical: Sizes.fixPadding }}>
                            {item.descritption}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', }}>
                            {item.isLoack ?
                                <MaterialIcons name="lock" size={22} color="black" />
                                :
                                <MaterialIcons name="lock-open" size={22} color="black" />}
                            <Text style={{ ...Fonts.blackRegular, marginLeft: Sizes.fixPadding }}>
                                {item.isLoack ? 'Locked' : 'Unlocked'}
                            </Text>
                        </View>
                    </View>
                </TouchableOpacity>
                <View style={styles.dividerStyle}></View>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    lessonInfoContainerStyle: {
        flexDirection: 'row',
        marginVertical: Sizes.fixPadding,
        alignItems: 'center'
    },
    lessonInfoImageStyle: {
        height: 110.0,
        width: 110.0,
        borderRadius: Sizes.fixPadding * 2.0,
        marginLeft: Sizes.fixPadding
    },
    dividerStyle: {
        backgroundColor: 'gray',
        height: 0.30,
        marginVertical: Sizes.fixPadding
    },
    animatedView: {
        backgroundColor: "#333333",
        position: "absolute",
        bottom: 20,
        alignSelf: 'center',
        borderRadius: Sizes.fixPadding * 2.0,
        paddingHorizontal: Sizes.fixPadding + 5.0,
        paddingVertical: Sizes.fixPadding,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default CoursesLessonsScreen;