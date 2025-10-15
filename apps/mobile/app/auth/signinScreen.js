import React, { useState, useCallback } from "react";
import { Text, View, TextInput, StyleSheet, TouchableOpacity, BackHandler, Alert } from "react-native";
import CollapsingToolbar from "../../component/sliverAppBar";
import { Fonts, Sizes, Colors } from "../../constant/styles";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import MyStatusBar from "../../component/myStatusBar";
import { useNavigation } from "expo-router";
import { wpLogin, wpFetch } from "../../src/_core/wp";

function SigninScreen() {

    const navigation = useNavigation();

    const backAction = () => {
        backClickCount == 1 ? BackHandler.exitApp() : _spring();
        return true;
    };

    useFocusEffect(
        useCallback(() => {
            const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
            return () => {
                backHandler.remove();
            };
        }, [backAction])
    );

    function _spring() {
        updateState({ backClickCount: 1 });
        setTimeout(() => {
            updateState({ backClickCount: 0 })
        }, 1000)
    }

    const [state, setState] = useState({
        passwordVisible: false,
        passwordFocus: false,
        usernameFocus: false,
        backClickCount: 0,
        username: "",
        password: "",
        submitting: false,
    })

    const updateState = (data) => setState((state) => ({ ...state, ...data }))

    const {
        passwordVisible,
        passwordFocus,
        usernameFocus,
        backClickCount,
        username,
        password,
        submitting,
    } = state;

    const handleSignin = async () => {
        if (!username || !password) {
            Alert.alert("Bodhi Medicine", "Ingresa tu correo y contraseña.");
            return;
        }
        updateState({ submitting: true });
        try {
            await wpLogin(username, password);
            try {
                const meRes = await wpFetch("/wp-json/wp/v2/users/me", { method: "GET" });
                const profile = await meRes.json();
                console.log("[me data]", profile);
            } catch (meError) {
                console.log("[me error]", meError);
            }
            navigation.replace("(tabs)");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Login falló";
            Alert.alert("Bodhi Medicine", message);
        } finally {
            updateState({ submitting: false });
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
            <MyStatusBar />
            <CollapsingToolbar
                element={<Text style={{ ...Fonts.black25Bold, color: Colors.whiteColor }}>Iniciar sesión</Text>}
                toolbarColor={Colors.primaryColor}
                toolBarMinHeight={40}
                toolbarMaxHeight={230}
                src={require('../../assets/images/appbar_bg.png')}>
                <View style={{
                    paddingVertical: Sizes.fixPadding * 7.0,
                    paddingHorizontal: Sizes.fixPadding * 2.0
                }}>
                    {userNameTextField()}
                    {passwordTextField()}
                    {signinButton()}
                    {forgotPasswordText()}
                </View>
            </CollapsingToolbar>
            {
                backClickCount == 1
                    ?
                    <View style={[styles.animatedView]}>
                        <Text style={{ ...Fonts.white15Regular }}>
                            Presiona atrás nuevamente para salir
                        </Text>
                    </View>
                    :
                    null
            }
        </View>
    )

    function forgotPasswordText() {
        return (
            <Text style={{ ...Fonts.gray18Bold, textAlign: 'center' }}>
                ¿Olvidaste tu contraseña?
            </Text>
       )
   }

   function signinButton() {
        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handleSignin}
                disabled={submitting}
                style={[styles.signinButtonStyle, submitting && { opacity: 0.6 }]}
            >
                <Text style={{ ...Fonts.white19Bold }}>{submitting ? "Ingresando..." : "Entrar"}</Text>
            </TouchableOpacity>
        )
    }

    function passwordTextField() {
        return (
            <View style={{ marginBottom: Sizes.fixPadding * 2.5 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TextInput
                        placeholder="Contraseña"
                        placeholderTextColor={Colors.grayColor}
                        style={{padding:0, ...Fonts.black17Regular, flex: 1 }}
                        value={password}
                        onChangeText={(text) => updateState({ password: text })}
                        onFocus={() => updateState({ passwordFocus: true })}
                        onBlur={() => updateState({ passwordFocus: false })}
                        cursorColor={Colors.primaryColor}
                        selectionColor={Colors.primaryColor}
                        secureTextEntry={!passwordVisible}
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

    function userNameTextField() {
        return (
            <View style={{ marginBottom: Sizes.fixPadding * 2.5 }}>
                <TextInput
                    placeholder="Correo electrónico"
                    placeholderTextColor={Colors.grayColor}
                    style={{padding:0, ...Fonts.black17Regular, flex: 1 }}
                    value={username}
                    onChangeText={(text) => updateState({ username: text })}
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
}

const styles = StyleSheet.create({
    signinButtonStyle: {
        backgroundColor: Colors.primaryColor,
        paddingVertical: Sizes.fixPadding + 5.0,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: Sizes.fixPadding - 5.0,
        marginVertical: Sizes.fixPadding + 5.0
    },
    animatedView: {
        backgroundColor: "#333333",
        position: "absolute",
        bottom: 20.0,
        alignSelf: 'center',
        borderRadius: Sizes.fixPadding * 2.0,
        paddingHorizontal: Sizes.fixPadding + 5.0,
        paddingVertical: Sizes.fixPadding,
        justifyContent: "center",
        alignItems: "center",
    },
})

export default SigninScreen;
