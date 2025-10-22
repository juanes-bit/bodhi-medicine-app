import React, { useState, useCallback } from "react";
import {
    Text,
    View,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    BackHandler,
    Alert,
    ImageBackground,
    Image,
    StatusBar,
    SafeAreaView,
} from "react-native";
import { Fonts, Sizes, Colors } from "../../constant/styles";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
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
                const profile = await wpFetch("/wp-json/wp/v2/users/me", { method: "GET" });
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
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <ImageBackground
                source={require("../../assets/images/login-background.png")}
                style={styles.background}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.content}>
                            <View style={styles.logoWrapper}>
                                <Image
                                    source={require("../../assets/images/logo-bodhi-white.png")}
                                    style={styles.logoImage}
                                />
                            </View>
                            <View style={styles.form}>
                                {userNameTextField()}
                                {passwordTextField()}
                                {signinButton()}
                                {forgotPasswordText()}
                            </View>
                        </View>
                    </SafeAreaView>
                </View>
            </ImageBackground>
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
            <TouchableOpacity
                activeOpacity={0.8}
                style={styles.recoverWrapper}
                onPress={() => navigation.push("auth/verificationScreen")}
            >
                <Text style={styles.recoverText}>Recuperar contraseña</Text>
            </TouchableOpacity>
        );
    }

    function signinButton() {
        return (
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignin}
                disabled={submitting}
                style={[
                    styles.signinButton,
                    submitting && styles.signinButtonDisabled,
                ]}
            >
                <Text style={styles.signinButtonText}>
                    {submitting ? "Ingresando..." : "Ingresar"}
                </Text>
            </TouchableOpacity>
        );
    }

    function passwordTextField() {
        return (
            <View style={[styles.inputWrapper, passwordFocus && styles.inputWrapperFocused]}>
                <TextInput
                    placeholder="CONTRASEÑA"
                    placeholderTextColor="rgba(255,255,255,0.85)"
                    style={styles.input}
                    value={password}
                    onChangeText={(text) => updateState({ password: text })}
                    onFocus={() => updateState({ passwordFocus: true })}
                    onBlur={() => updateState({ passwordFocus: false })}
                    cursorColor={Colors.whiteColor}
                    selectionColor={Colors.whiteColor}
                    secureTextEntry={!passwordVisible}
                />
                <MaterialCommunityIcons
                    name={passwordVisible ? "eye-off" : "eye"}
                    size={22}
                    color="rgba(255,255,255,0.9)"
                    onPress={() => updateState({ passwordVisible: !passwordVisible })}
                />
            </View>
        );
    }

    function userNameTextField() {
        return (
            <View style={[styles.inputWrapper, usernameFocus && styles.inputWrapperFocused]}>
                <TextInput
                    placeholder="CORREO ELECTRÓNICO"
                    placeholderTextColor="rgba(255,255,255,0.85)"
                    style={styles.input}
                    value={username}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    onChangeText={(text) => updateState({ username: text })}
                    onFocus={() => updateState({ usernameFocus: true })}
                    onBlur={() => updateState({ usernameFocus: false })}
                    cursorColor={Colors.whiteColor}
                    selectionColor={Colors.whiteColor}
                />
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.blackColor,
    },
    background: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(100, 137, 191, 0.65)",
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: "center",
        paddingHorizontal: Sizes.fixPadding * 2,
    },
    logoWrapper: {
        alignItems: "center",
        marginBottom: Sizes.fixPadding * 4,
    },
    logoImage: {
        width: 220,
        height: 120,
        marginBottom: Sizes.fixPadding * 3,
        resizeMode: "contain",
    },
    form: {
        width: "100%",
    },
    inputWrapper: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: Sizes.fixPadding * 1.6,
        paddingHorizontal: Sizes.fixPadding * 1.5,
        borderRadius: 32,
        marginBottom: Sizes.fixPadding * 2,
        backgroundColor: "rgba(195, 210, 230, 0.45)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.25)",
    },
    inputWrapperFocused: {
        backgroundColor: "rgba(195, 210, 230, 0.75)",
        borderColor: Colors.whiteColor,
    },
    input: {
        flex: 1,
        ...Fonts.white16Bold,
        padding: 0,
        letterSpacing: 1,
    },
    signinButton: {
        backgroundColor: Colors.primaryColor,
        paddingVertical: Sizes.fixPadding * 1.8,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 32,
        marginTop: Sizes.fixPadding * 2,
        shadowColor: "rgba(0,0,0,0.35)",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 6,
    },
    signinButtonDisabled: {
        opacity: 0.7,
    },
    signinButtonText: {
        ...Fonts.white19Bold,
        letterSpacing: 1.5,
        textTransform: "uppercase",
    },
    recoverWrapper: {
        marginTop: Sizes.fixPadding * 1.5,
        alignItems: "center",
    },
    recoverText: {
        ...Fonts.white15Regular,
        opacity: 0.85,
        textTransform: "uppercase",
        letterSpacing: 1.5,
    },
    animatedView: {
        backgroundColor: "rgba(0,0,0,0.65)",
        position: "absolute",
        bottom: 20.0,
        alignSelf: 'center',
        borderRadius: Sizes.fixPadding * 2.0,
        paddingHorizontal: Sizes.fixPadding + 5.0,
        paddingVertical: Sizes.fixPadding,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default SigninScreen;
