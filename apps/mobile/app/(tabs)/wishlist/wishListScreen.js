import { SwipeItem, SwipeButtonsContainer } from 'react-native-swipe-item';
import React, { useState } from "react";
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
} from "react-native";
import { Colors, Fonts, Sizes, CommonStyles } from "../../../constant/styles";
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import CollapsingToolbar from "../../../component/sliverAppBar";
import { Snackbar } from 'react-native-paper';
import { useNavigation } from "expo-router";

const { width } = Dimensions.get('screen');

const wishListData = [
    {
        key: '1',
        image: require('../../../assets/images/new_course/new_course_4.png'),
        subject: 'Bodhi Medicine para Hombres',
        description: 'Masterclass para hombres que abre un nuevo paradigma de salud con autonomía y amor propio.',
        courseCategory: 'Bodhi Medicine',
        courseRating: '5.0',
        courseNumberOfRating: '128',
        coursePrice: '59',
        courseId: 1,
    },
    {
        key: '2',
        image: require('../../../assets/images/new_course/new_course_2.png'),
        subject: 'HeartMath',
        description: 'Crea coherencia corazón-cerebro con prácticas sencillas para equilibrar tu sistema nervioso.',
        courseCategory: 'HeartMath',
        courseRating: '4.9',
        courseNumberOfRating: '95',
        coursePrice: '64',
        courseId: 2,
    },
    {
        key: '3',
        image: require('../../../assets/images/new_course/new_course_3.png'),
        subject: 'La Menopausia con Amor',
        description: 'Taller de cinco horas para transitar la menopausia con herramientas claras y autocuidado.',
        courseCategory: 'La Menopausia con Amor',
        courseRating: '4.8',
        courseNumberOfRating: '87',
        coursePrice: '59',
        courseId: 3,
    },
];

const WishListScreen = () => {

    const navigation = useNavigation();

    const [showSnackBar, setShowSnackBar] = useState(false);

    const [listData, setListData] = useState(wishListData);

    const rightButton = ({ key }) => (
        <SwipeButtonsContainer>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => deleteRow({ rowKey: key })}
                style={styles.backDeleteContinerStyle}
            >
                <MaterialIcons name="delete" size={25} color={Colors.whiteColor} />
                <Text style={{ ...Fonts.white15Regular }}>Eliminar</Text>
            </TouchableOpacity>
        </SwipeButtonsContainer >
    );

    const deleteRow = ({ rowKey }) => {
        const newData = [...listData];
        const prevIndex = listData.findIndex(item => item.key === rowKey);
        newData.splice(prevIndex, 1);
        setListData(newData);
        setShowSnackBar(true);
    };

    function renderItem({ item }) {
        return (
            <View key={item.key}>
                <SwipeItem
                    style={styles.button}
                    rightButtons={rightButton({ key: item.key })}
                >
                    <View style={styles.wishlistContainerStyle}>
                        <Image
                            source={item.image}
                            style={styles.wishlistImageStyle}
                            resizeMode="cover"
                        />
                        <View style={styles.wishlistInfoContainerStyle}>
                            <Text style={{ ...Fonts.black17Bold }}>
                                {item.subject}
                            </Text>
                            <Text style={{ ...Fonts.gray15Regular, marginVertical: Sizes.fixPadding }}>
                                {item.description}
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={() => navigation.push('courseDetail/courseDetailScreen', {
                                    image: item.image,
                                    courseName: item.subject,
                                    courseCategory: item.courseCategory,
                                    courseRating: item.courseRating,
                                    courseNumberOfRating: item.courseNumberOfRating,
                                    coursePrice: item.coursePrice,
                                    courseId: item.courseId,
                                })}
                                style={styles.viewButton}
                            >
                                <Text style={{ ...Fonts.white15Bold }}>Ver</Text>
                                <MaterialIcons name="chevron-right" size={20} color={Colors.whiteColor} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SwipeItem>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
            <CollapsingToolbar
                element={
                    <Text style={{ ...Fonts.black25Bold, color: Colors.whiteColor }}>Lista de deseos</Text>
                }
                toolbarColor={Colors.primaryColor}
                toolBarMinHeight={40}
                toolbarMaxHeight={230}
                src={require('../../../assets/images/appbar_bg.png')}
            >
                {listData.length == 0 ?
                    <View style={{
                        flex: 0.7,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <FontAwesome5 name="heart-broken" size={50} color="gray" />
                        <Text style={{ ...Fonts.gray17Bold, marginTop: Sizes.fixPadding * 2.0 }}>
                            No hay cursos en la lista
                        </Text>
                    </View>
                    :
                    <View style={styles.container} >
                        {listData.map((item) => renderItem({ item }))}
                    </View>}
            </CollapsingToolbar>
            <Snackbar
                style={styles.snackBarContainerStyle}
                visible={showSnackBar}
                onDismiss={() => setShowSnackBar(false)}
            >
                Curso eliminado
            </Snackbar>
        </View>
    );
}

const styles = StyleSheet.create({
    button: {
        width: '100%',
        alignSelf: 'center',
        marginVertical: 30,
    },
    wishlistContainerStyle: {
        flexDirection: 'row',
        width: width - 30,
        elevation: 2.0,
        ...CommonStyles.shadow,
        backgroundColor: Colors.whiteColor,
        paddingVertical: Sizes.fixPadding + 5.0,
        borderRadius: Sizes.fixPadding * 2.0,
        alignSelf: 'center',
        marginVertical: Sizes.fixPadding
    },
    wishlistImageStyle: {
        height: 110.0,
        width: 110.0,
        borderRadius: Sizes.fixPadding * 2.0,
        marginLeft: Sizes.fixPadding
    },
    wishlistInfoContainerStyle: {
        marginLeft: Sizes.fixPadding,
        width: width - 180,
        marginVertical: 3.0
    },
    viewButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        backgroundColor: Colors.primaryColor,
        paddingHorizontal: Sizes.fixPadding * 1.5,
        paddingVertical: Sizes.fixPadding - 3.0,
        borderRadius: Sizes.fixPadding * 1.5,
        marginTop: Sizes.fixPadding - 2.0
    },
    backDeleteContinerStyle: {
        height: 110.0,
        width: 110.0,
        alignItems: 'center',
        alignSelf: 'center',
        backgroundColor: 'red',
        justifyContent: 'center',
        marginVertical: 25.0
    },
    container: {
        backgroundColor: '#FAFAFA',
        flex: 1,
    },
    snackBarContainerStyle: {
        position: 'absolute',
        bottom:-10.0,
        left: -10.0,
        right: -10.0,
        backgroundColor: '#333333',
    },
});

export default WishListScreen;
