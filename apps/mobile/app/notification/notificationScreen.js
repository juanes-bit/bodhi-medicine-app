import React, { useState, useRef } from 'react';
import { Fonts, Colors, Sizes, CommonStyles } from "../../constant/styles";
import {
    Text,
    View,
    StyleSheet,
    Animated,
    Dimensions,
} from "react-native";
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';
import { Snackbar } from 'react-native-paper';
import MyStatusBar from '../../component/myStatusBar';
import { useNavigation } from 'expo-router';

const { width } = Dimensions.get('window');

const rowTranslateAnimatedValues = {};

const NotificationScreen = () => {

    const navigation = useNavigation();

    const [showSnackBar, setShowSnackBar] = useState(false);
    const [snackBarMsg, setSnackBarMsg] = useState('');
    const [listData, setListData] = useState(
        [
            {
                key: '1',
                name: 'Nuevas fechas Bodhi Medicine 2026',
                description: 'Reserva tu lugar en los módulos 1 y 2 de la formación 2026 y vive el nuevo paradigma de salud.',

            },
            {
                key: '2',
                name: 'Masterclass para Hombres',
                description: 'Descubre la masterclass Bodhi Medicine para Hombres. Acceso anticipado y cupos limitados.',
            },
        ],
    );

    Array(listData.length + 1)
        .fill('')
        .forEach((_, i) => {
            rowTranslateAnimatedValues[`${i}`] = new Animated.Value(1);
        });

    const animationIsRunning = useRef(false);

    const onSwipeValueChange = swipeData => {

        const { key, value } = swipeData;

        if ((value < -width || value > width) && !animationIsRunning.current) {
            animationIsRunning.current = true;
            Animated.timing(rowTranslateAnimatedValues[key], {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
            }).start(() => {

                const newData = [...listData];
                const prevIndex = listData.findIndex(item => item.key === key);
                newData.splice(prevIndex, 1);
                const removedItem = listData.find(item => item.key === key);

                setSnackBarMsg(`${removedItem.name} eliminada`);

                setListData(newData);

                setShowSnackBar(true);

                animationIsRunning.current = false;
            });
        }
    };

    const renderItem = data => (
        <Animated.View
            style={[
                {
                    height: rowTranslateAnimatedValues[
                        data.item.key
                    ].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 130],
                    }),
                },
            ]}
        >
            <View style={{ flex: 1, backgroundColor: '#F1F3F6' }}>
                <View style={styles.notificationContainerStyle}>
                    <View style={styles.notificationIconContainerStyle}>
                        <MaterialIcons name="notifications-none" size={35} color="black" />
                    </View>
                    <View style={styles.notificationDescriptionStyle}>
                        <Text numberOfLines={1} style={{ ...Fonts.black19Regular }}>
                            {data.item.name}
                        </Text>
                        <Text numberOfLines={3} style={{ ...Fonts.gray15Regular, }}>
                            {data.item.description}
                        </Text>
                    </View>
                </View>
            </View>
        </Animated.View>
    );

    const renderHiddenItem = () => (
        <View style={styles.rowBack}>
        </View>
    );

    function header() {
        return (
            <View style={styles.headerContainerStyle}>
                <MaterialIcons
                    name="arrow-back-ios"
                    size={24}
                    color={Colors.whiteColor}
                    onPress={() => navigation.pop()}
                />
                <Text style={{ ...Fonts.black19Bold, color: Colors.whiteColor, marginLeft: Sizes.fixPadding }}>
                    Mis notificaciones
                </Text>
            </View>
        )
    }

    return (
        <View style={{ flex: 1, }}>
            <MyStatusBar />
            <View style={styles.container}>
                {header()}
                {listData.length === 0 ?
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F3F6' }}>
                        <Ionicons name="notifications-off-outline" size={70} color="gray" />
                        <Text style={{ ...Fonts.gray17Bold, marginTop: Sizes.fixPadding * 2.0 }}>
                            No hay notificaciones
                        </Text>
                    </View>
                    :
                    <SwipeListView
                        data={listData}
                        renderItem={renderItem}
                        renderHiddenItem={renderHiddenItem}
                        rightOpenValue={-width}
                        leftOpenValue={width}
                        onSwipeValueChange={onSwipeValueChange}
                        useNativeDriver={false}
                    />
                }
                <Snackbar
                    style={{ position: 'absolute', bottom: -10.0, left: -10.0, right: -10.0, backgroundColor: '#333333' }}
                    visible={showSnackBar}
                    onDismiss={() => setShowSnackBar(false)}
                >
                    {snackBarMsg}
                </Snackbar>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primaryColor,
        paddingVertical: Sizes.fixPadding + 5.0,
        paddingHorizontal: Sizes.fixPadding * 2.0,
        elevation: 10.0,
    },
    notificationContainerStyle: {
        height: 120.0,
        alignItems: 'center',
        flexDirection: 'row',
        backgroundColor: 'white',
        marginHorizontal: Sizes.fixPadding,
        marginVertical: Sizes.fixPadding - 5.0,
        borderRadius: Sizes.fixPadding - 5.0,
        elevation: 2.0,
        ...CommonStyles.shadow,
        paddingLeft: Sizes.fixPadding,
    },
    notificationIconContainerStyle: {
        height: 80.0,
        width: 80.0,
        backgroundColor: '#FFE0B2',
        borderRadius: 40.0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        backgroundColor: '#F1F3F6',
        flex: 1,
    },
    rowBack: {
        alignItems: 'center',
        backgroundColor: 'red',
        flex: 1,
        marginVertical: Sizes.fixPadding - 5.0,
    },
    notificationDescriptionStyle: {
        marginLeft: Sizes.fixPadding * 2.0,
        width: width - 150,
        justifyContent: 'space-between',
        height: 120.0,
        paddingVertical: Sizes.fixPadding + 3.0
    }
});

export default NotificationScreen;
