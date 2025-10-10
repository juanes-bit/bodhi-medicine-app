import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, StyleSheet, } from "react-native";
import CollapsingToolbar from "../../component/sliverAppBar";
import { Fonts, Sizes, Colors } from "../../constant/styles";
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import MyStatusBar from "../../component/myStatusBar";
import { useNavigation } from "expo-router";

const SignUpScreen = () => {

    const navigation = useNavigation();

    const [state, setState] = useState({
        passwordVisible: false,
        confirmPasswordVisible: false,
        passwordFocus: false,
        confirmPasswordFocus: false,
        usernameFocus: false,
        emailFocus: false,
        phoneNumberFocus: false,
    })

    const updateState = (data) => setState((state) => ({ ...state, ...data }))

    const {
        passwordVisible,
        confirmPasswordVisible,
        passwordFocus,
        confirmPasswordFocus,
        usernameFocus,
        emailFocus,
        phoneNumberFocus,
    } = state;

    return (
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
            <MyStatusBar />
            <CollapsingToolbar
                leftItem={
                    <MaterialIcons
                        name="arrow-back-ios"
                        size={24}
                        color={Colors.blackColor}
                        onPress={() => navigation.pop()}
                    />
                }
                element={
                    <Text style={{ ...Fonts.black25Bold }}>Sign up</Text>
                }
                toolbarColor={Colors.primaryColor}
                toolBarMinHeight={80}
                toolbarMaxHeight={230}
                src={require('../../assets/images/appbar_bg.png')}>
                <View
                    style={{
                        paddingTop: Sizes.fixPadding * 7.0,
                        paddingHorizontal: Sizes.fixPadding * 2.0,
                    }}
                >
                    {userNameTextField()}
                    {emailTextField()}
                    {phoneNumberTextField()}
                    {passwordTextField()}
                    {confirmPasswordTextField()}
                    {signupButton()}
                </View>
            </CollapsingToolbar>
        </View>
    )

    function signupButton() {
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => navigation.push('auth/verificationScreen')}
                style={styles.signupButtonStyle}>
                <Text style={{ ...Fonts.black19Bold }}>Sign up</Text>
            </TouchableOpacity>
        )
    }

    function confirmPasswordTextField() {
        return (
            <View style={{ marginBottom: Sizes.fixPadding * 2.5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                        placeholder="Confirm password"
                        placeholderTextColor={Colors.grayColor}
                        style={{ padding:0,...Fonts.black17Regular, flex: 1 }}
                        onFocus={() => updateState({ confirmPasswordFocus: true })}
                        onBlur={() => updateState({ confirmPasswordFocus: false })}
                        cursorColor={Colors.primaryColor}
                        selectionColor={Colors.primaryColor}
                        secureTextEntry={!confirmPasswordVisible}
                        textContentType="oneTimeCode"
                    />
                    <MaterialCommunityIcons
                        name={confirmPasswordVisible ? "eye-off" : "eye"}
                        size={24}
                        color={confirmPasswordFocus ? Colors.primaryColor : "#898989"}
                        onPress={() => updateState({ confirmPasswordVisible: !confirmPasswordVisible })}
                    />
                </View>
                <View style={{
                    backgroundColor: confirmPasswordFocus ? Colors.primaryColor : Colors.grayColor,
                    height: 1,
                    marginTop: Sizes.fixPadding - 3.0
                }} />
            </View>
        )
    }

    function phoneNumberTextField() {
        return (
            <View style={{ marginBottom: Sizes.fixPadding * 2.5 }}>
                <TextInput
                    placeholder="Phone number"
                    placeholderTextColor={Colors.grayColor}
                    style={{padding:0, ...Fonts.black17Regular, flex: 1 }}
                    onFocus={() => updateState({ phoneNumberFocus: true })}
                    onBlur={() => updateState({ phoneNumberFocus: false })}
                    cursorColor={Colors.primaryColor}
                    selectionColor={Colors.primaryColor}
                    keyboardType="phone-pad"
                />
                <View style={{
                    backgroundColor: phoneNumberFocus ? Colors.primaryColor : Colors.grayColor,
                    height: 1,
                    marginTop: Sizes.fixPadding - 3.0
                }} />
            </View>
        )
    }

    function emailTextField() {
        return (
            <View style={{ marginBottom: Sizes.fixPadding * 2.5 }}>
                <TextInput
                    placeholder="Email"
                    placeholderTextColor={Colors.grayColor}
                    style={{ padding:0,...Fonts.black17Regular, flex: 1 }}
                    onFocus={() => updateState({ emailFocus: true })}
                    onBlur={() => updateState({ emailFocus: false })}
                    cursorColor={Colors.primaryColor}
                    selectionColor={Colors.primaryColor}
                    keyboardType="email-address"
                />
                <View style={{
                    backgroundColor: emailFocus ? Colors.primaryColor : Colors.grayColor,
                    height: 1,
                    marginTop: Sizes.fixPadding - 3.0
                }} />
            </View>
        )
    }

    function userNameTextField() {
        return (
            <View style={{ marginBottom: Sizes.fixPadding * 2.5 }}>
                <TextInput
                    placeholder="Username"
                    placeholderTextColor={Colors.grayColor}
                    style={{ padding: 0, ...Fonts.black17Regular, flex: 1 }}
                    onFocus={() => updateState({ usernameFocus: true })}
                    onBlur={() => updateState({ usernameFocus: false })}
                    cursorColor={Colors.primaryColor}
                    selectionColor={Colors.primaryColor}
                />
                <View style={{
                    backgroundColor: usernameFocus ? Colors.primaryColor : Colors.grayColor,
                    height: 1,
                    marginTop: Sizes.fixPadding - 3.0
                }} />
            </View>
        )
    }

    function passwordTextField() {
        return (
            <View style={{ marginBottom: Sizes.fixPadding * 2.5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                        placeholder="Password"
                        placeholderTextColor={Colors.grayColor}
                        style={{padding:0, ...Fonts.black17Regular, flex: 1 }}
                        onFocus={() => updateState({ passwordFocus: true })}
                        onBlur={() => updateState({ passwordFocus: false })}
                        cursorColor={Colors.primaryColor}
                        selectionColor={Colors.primaryColor}
                        secureTextEntry={!passwordVisible}
                        textContentType="oneTimeCode"
                    />
                    <MaterialCommunityIcons
                        name={passwordVisible ? "eye-off" : "eye"}
                        size={24}
                        color={passwordFocus ? Colors.primaryColor : "#898989"}
                        onPress={() => updateState({ passwordVisible: !passwordVisible })}
                    />
                </View>
                <View style={{
                    backgroundColor: passwordFocus ? Colors.primaryColor : Colors.grayColor,
                    height: 1,
                    marginTop: Sizes.fixPadding - 3.0
                }} />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    signupButtonStyle: {
        backgroundColor: Colors.primaryColor,
        paddingVertical: Sizes.fixPadding + 5.0,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Sizes.fixPadding - 5.0,
        marginVertical: Sizes.fixPadding + 5.0
    }
})

export default SignUpScreen;