import React, { useState } from "react";
import {
    Text,
    View,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    TouchableOpacity,
    Keyboard,
} from "react-native";
import CollapsingToolbar from "../../component/sliverAppBar";
import { Colors, Fonts, Sizes } from "../../constant/styles";
import OTPField from 'react-native-otp-field';
import { Modal } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons'
import MyStatusBar from "../../component/myStatusBar";
import { useNavigation } from "expo-router";

const { width } = Dimensions.get('screen');

const VerificationScreen = () => {

    const navigation = useNavigation();

    const [otpInput, setotpInput] = useState('');
    const [isLoading, setisLoading] = useState(false);

    return (
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
            <MyStatusBar />
            <CollapsingToolbar
                leftItem={
                    <MaterialIcons
                        name="arrow-back-ios"
                        size={24}
                        color={Colors.whiteColor}
                        onPress={() => navigation.pop()}
                    />
                }
                element={
                    <Text style={{ ...Fonts.black25Bold, color: Colors.whiteColor, marginBottom: Sizes.fixPadding }}>
                        Ingresa el código de 4 dígitos
                    </Text>
                }
                toolbarColor={Colors.primaryColor}
                toolBarMinHeight={40}
                toolbarMaxHeight={230}
                src={require('../../assets/images/appbar_bg.png')}>
                <View style={{
                    paddingTop: Sizes.fixPadding * 4.0,
                    paddingHorizontal: Sizes.fixPadding * 2.0
                }}>
                    <Text style={{ ...Fonts.gray14Regular, textAlign: 'center' }}>
                        Ingresa el código que enviamos a tu teléfono.
                    </Text>
                    {otpFields()}
                    {resendInfo()}
                    {submitButton()}
                </View>
            </CollapsingToolbar>
            {loading()}
        </View>
    )

    function submitButton() {
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                    setisLoading(true)
                    setTimeout(() => {
                        setisLoading(false)
                        navigation.push('(tabs)')
                    }, 2000);
                }}
                style={styles.submitButtonStyle}
            >
                <Text style={{ ...Fonts.white19Bold }}>Confirmar</Text>
            </TouchableOpacity>
        )
    }

    function resendInfo() {
        return (
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: Sizes.fixPadding * 4.0
            }}>
                <Text style={{ ...Fonts.gray14Regular }}>
                    ¿No recibiste el código?
                </Text>
                <Text style={{ ...Fonts.black15Regular, marginLeft: Sizes.fixPadding }}>
                    Reenviar
                </Text>
            </View>
        )
    }

    function otpFields() {
        return (
            <OTPField
                length={4}
                value={otpInput}
                onChange={(val) => {
                    setotpInput(val);
                    if (val.length === 4) {
                        Keyboard.dismiss();
                        setisLoading(true)
                        setTimeout(() => {
                            setisLoading(false)
                            navigation.push('(tabs)')
                        }, 2000);
                    }
                }}
                textFieldStyle={{ ...styles.textFieldStyle }}
                containerStyle={{
                    marginTop: Sizes.fixPadding * 5.0,
                }}
                cursorColor={Colors.primaryColor}
                selectionColor={Colors.primaryColor}
            />
        )
    }

    function loading() {
        return (
            <Modal
                visible={isLoading}
                contentContainerStyle={styles.dialogContainerStyle}
            >
                <View style={{ backgroundColor: 'white', alignItems: 'center', }}>
                    <ActivityIndicator color={Colors.primaryColor} size="large" />
                    <Text style={{ ...Fonts.lightGrayColor17Bold, paddingBottom: Sizes.fixPadding - 5.0, marginTop: Sizes.fixPadding * 2.0 }}>
                        Por favor espera...
                    </Text>
                </View>
            </Modal>
        );
    }
}

const styles = StyleSheet.create({
    textFieldStyle: {
        borderBottomWidth: null,
        borderRadius: Sizes.fixPadding - 5.0,
        backgroundColor: Colors.whiteColor,
        borderColor: Colors.primaryColor,
        borderWidth: 1.0,
        ...Fonts.black17Bold,
        elevation: 1.0,
        width: width / 8,
        height: width / 8,
    },
    dialogContainerStyle: {
        backgroundColor: Colors.whiteColor,
        width: '85%',
        alignSelf: 'center',
        borderRadius: Sizes.fixPadding,
        padding: Sizes.fixPadding * 2.0
    },
    submitButtonStyle: {
        backgroundColor: Colors.primaryColor,
        paddingVertical: Sizes.fixPadding + 5.0,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Sizes.fixPadding - 5.0,
        marginVertical: Sizes.fixPadding * 2.0
    }
})

export default VerificationScreen;
