import React, { useState } from "react";
import { Text, View, StyleSheet, Dimensions, Image, TouchableOpacity } from "react-native";
import { Colors, Fonts, Sizes, CommonStyles } from "../../constant/styles";
import { MaterialIcons } from '@expo/vector-icons';
import CollapsingToolbar from "../../component/sliverAppBar";
import { Modal } from 'react-native-paper';
import MyStatusBar from "../../component/myStatusBar";
import { useLocalSearchParams, useNavigation } from "expo-router";

const { width } = Dimensions.get('screen');

const TakeCourseScreen = () => {

    const navigation = useNavigation();

    const { courseName, image } = useLocalSearchParams();

    const [state, setState] = useState({
        paymentMethodDialog: false,
        currentIndex: 1,
        thanksDialog: false,
    })

    const updateState = (data) => setState((state) => ({ ...state, ...data }))

    const {
        paymentMethodDialog,
        currentIndex,
        thanksDialog,
    } = state;

    return (
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
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
                element={
                    <Text style={{ ...Fonts.primaryColor28Bold, marginBottom: Sizes.fixPadding }}>{courseName}</Text>
                }
                borderBottomRadius={20}
                isImageBlur={true}
                toolbarColor={Colors.whiteColor}
                toolBarMinHeight={40}
                toolbarMaxHeight={300}
                src={image}>
                <View style={{ paddingTop: Sizes.fixPadding * 4.0 }}>
                    {allAccessAndClassOnlyInfo(
                        {
                            title: 'All-Access Pass',
                            description: ' You will get unlimited access to every class you want for a year.All lessons for you auto-renews annually.',
                            amount: 499.99,
                            type: 'year'
                        }
                    )}
                    {allAccessAndClassOnlyInfo(
                        {
                            title: 'This Class Only',
                            description: 'A good choice for who want to learn a single class for a long time.',
                            amount: 59,
                            type: 'once'
                        }
                    )}
                </View>
            </CollapsingToolbar>
            {paymentMethods()}
            {thankYouInfo()}
        </View>
    )

    function thankYouInfo() {
        return (
            <Modal
                visible={thanksDialog}
                onDismiss={() => { }}
                contentContainerStyle={styles.dialogContainerStyle}
            >
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <View style={styles.thankYouDialogIconContainerStyle}>
                        <MaterialIcons name="check" size={40} color={Colors.primaryColor} />
                    </View>
                    <Text style={{ ...Fonts.lightGrayColor21Bold, marginTop: Sizes.fixPadding * 2.0 }}>
                        Thanks for purchasing!
                    </Text>
                </View>
            </Modal>
        )
    }

    function payments({ index, type, image }) {
        return (
            <View>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => updateState({ currentIndex: index })}
                    style={styles.paymentMethodContainerStyle}>
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            width: width - 200,
                            justifyContent: 'center'
                        }}
                    >
                        <View
                            style={{
                                borderColor: currentIndex == index ? Colors.primaryColor : 'gray',
                                ...styles.paymentMethosSelectionStyle
                            }}
                        >
                            {
                                currentIndex == index
                                    ?
                                    <View style={{ backgroundColor: Colors.primaryColor, width: 10.0, height: 10.0, borderRadius: 5.0 }} />
                                    :
                                    null
                            }
                        </View>
                        <View style={{ width: width - 200, }}>
                            <Text numberOfLines={1} style={{ ...Fonts.black17Bold }}>
                                {type}
                            </Text>
                        </View>
                    </View>
                    <Image
                        source={image}
                        style={{ height: 40.0, width: 40.0 }}
                        resizeMode="cover"
                    />
                </TouchableOpacity>
                {index == 3 ?
                    null :
                    <View style={{
                        backgroundColor: Colors.grayColor, height: 0.5,
                        marginVertical: Sizes.fixPadding + 5.0
                    }}></View>
                }
            </View>
        )
    }

    function paymentMethods() {
        return (
            <Modal
                visible={paymentMethodDialog}
                onDismiss={() => { updateState({ paymentMethodDialog: false }) }}
                contentContainerStyle={styles.dialogContainerStyle}
            >
                <View style={{ backgroundColor: 'white', alignItems: 'center', }}>
                    <Text style={{ ...Fonts.black20Bold, paddingBottom: Sizes.fixPadding * 4.0 }}>
                        Choose payment method
                    </Text>
                    {payments({
                        index: 1,
                        type: 'Credit / Debit Card',
                        image: require('../../assets/images/payment_icon/card.png')
                    })}
                    {payments({
                        index: 2,
                        type: 'PayPal',
                        image: require('../../assets/images/payment_icon/paypal.png')
                    })}
                    {payments({
                        index: 3,
                        type: 'Google Wallet',
                        image: require('../../assets/images/payment_icon/google_wallet.png')
                    })}

                    <View style={styles.cancelAndPayButtonContainerStyle}>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => updateState({ paymentMethodDialog: false })}
                            style={styles.cancelButtonStyle}
                        >
                            <Text style={{ ...Fonts.black15Bold }}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={() => {
                                updateState({ paymentMethodDialog: false, thanksDialog: true })
                                setTimeout(() => {
                                    updateState({ thanksDialog: false })
                                    navigation.push('(tabs)');
                                }, 3000);
                            }}
                            style={styles.payButtonStyle}
                        >
                            <Text style={{ ...Fonts.white15Bold }}>Pay</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        )
    }

    function allAccessAndClassOnlyInfo({ title, description, amount, type }) {
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => updateState({ paymentMethodDialog: true })}
                style={styles.allAccessAndClassOnlyInfoContainerStyle}>
                <Text style={{ ...Fonts.black19Bold }}>
                    {title}
                </Text>
                <Text style={{ ...Fonts.gray17Regular }}>
                    {description}
                </Text>
                <Text style={{ ...Fonts.black20Regular }}>
                    ${amount}/{type}
                </Text>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    allAccessAndClassOnlyInfoContainerStyle: {
        backgroundColor: Colors.whiteColor,
        elevation: 2.0,
        marginHorizontal: Sizes.fixPadding * 2.0,
        borderRadius: Sizes.fixPadding * 2.0,
        marginVertical: Sizes.fixPadding,
        paddingVertical: Sizes.fixPadding * 2.0,
        paddingHorizontal: Sizes.fixPadding * 2.0,
        height: 185.0,
        justifyContent: 'space-between',
        ...CommonStyles.shadow,
    },
    dialogContainerStyle: {
        backgroundColor: Colors.whiteColor,
        width: '90%',
        alignSelf: 'center',
        borderRadius: Sizes.fixPadding,
        paddingVertical: Sizes.fixPadding * 2.0,
        paddingHorizontal: Sizes.fixPadding
    },
    cancelButtonStyle: {
        flex: 0.50,
        backgroundColor: '#E0E0E0',
        borderRadius: Sizes.fixPadding - 5.0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Sizes.fixPadding,
        marginRight: Sizes.fixPadding + 5.0,
    },
    payButtonStyle: {
        flex: 0.50,
        backgroundColor: Colors.primaryColor,
        borderRadius: Sizes.fixPadding - 5.0,
        paddingVertical: Sizes.fixPadding,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Sizes.fixPadding + 5.0
    },
    paymentMethodContainerStyle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: width - 150.0,
    },
    paymentMethosSelectionStyle: {
        width: 18.0,
        height: 18.0,
        borderRadius: 9.0,
        backgroundColor: Colors.whiteColor,
        borderWidth: 2.0,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Sizes.fixPadding * 2.0
    },
    cancelAndPayButtonContainerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Sizes.fixPadding * 4.0,
        marginHorizontal: Sizes.fixPadding * 2.0,
    },
    thankYouDialogIconContainerStyle: {
        backgroundColor: Colors.whiteColor,
        borderColor: Colors.primaryColor,
        borderWidth: 1.0,
        width: 70.0, height: 70.0,
        borderRadius: 35.0,
        alignItems: 'center',
        justifyContent: 'center'
    }
});

export default TakeCourseScreen;