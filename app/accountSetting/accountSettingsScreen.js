import React, { useState } from "react";
import { Text, View, Platform, Modal, KeyboardAvoidingView, StyleSheet, Image, TextInput, TouchableOpacity, } from "react-native";
import CollapsingToolbar from "../../component/sliverAppBar";
import { Fonts, Sizes, Colors } from "../../constant/styles";
import { MaterialIcons } from '@expo/vector-icons';
import MyStatusBar from "../../component/myStatusBar";
import { useNavigation } from "expo-router";

const AccountSettingScreen = () => {

    const navigation = useNavigation();

    const [state, setState] = useState({
        phoneDialog: false,
        phone: '9603456878',
        changePhone: '9603456878',
        emailDialog: false,
        email: 'test@abc.com',
        changeEmail: 'test@abc.com',
        passwordDialog: false,
        password: '123456',
        changePassword: '123456',
        isLogout: false,
    })

    const updateState = (data) => setState((state) => ({ ...state, ...data }))

    const {
        phoneDialog,
        phone,
        changePhone,
        emailDialog,
        email,
        changeEmail,
        passwordDialog,
        password,
        changePassword,
        isLogout,
    } = state;

    return (
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
            <MyStatusBar />
            <CollapsingToolbar
                leftItem={
                    <MaterialIcons
                        name="arrow-back-ios"
                        size={25}
                        color={Colors.whiteColor}
                        onPress={() => navigation.pop()}
                    />}
                element={
                    <Text style={{ ...Fonts.black25Bold, color: Colors.whiteColor }}>Configuración de cuenta</Text>
                }
                toolbarColor={Colors.primaryColor}
                toolBarMinHeight={40}
                toolbarMaxHeight={230}
                childrenMinHeight={730}
                src={require('../../assets/images/appbar_bg.png')}>
                <View style={{
                    marginHorizontal: Sizes.fixPadding * 2.0,
                    marginTop: Sizes.fixPadding * 4.0
                }}>
                    {userPhoto()}
                    {userName()}
                    {editProfileText()}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => updateState({ phoneDialog: true })}
                    >
                    {editInfo({ title: 'Número de teléfono', value: phone })}
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => updateState({ emailDialog: true })}
                    >
                    {editInfo({ title: 'Correo electrónico', value: email })}
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => updateState({ passwordDialog: true })}
                    >
                    {editInfo({ title: 'Contraseña', value: '******' })}
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => updateState({ isLogout: true })}
                    >
                        {logoutText()}
                    </TouchableOpacity>

                </View>
            </CollapsingToolbar>
            {editPhoneDialog()}
            {editEmailDialog()}
            {editPasswordDialog()}
            {logOutDialog()}
        </View>
    )

    function logOutDialog() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={isLogout}
                onRequestClose={() => {
                    updateState({ isLogout: false })
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        updateState({ isLogout: false })
                    }}
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}
                >
                    <View style={{ justifyContent: "center", flex: 1 }}>
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => { }}
                            style={styles.dialogContainerStyle}
                        >
                            <View style={{ backgroundColor: 'white', alignItems: 'center', }}>
                                <Text style={{ ...Fonts.black20Bold, paddingBottom: Sizes.fixPadding - 5.0, }}>
                                    ¿Seguro que deseas salir?
                                </Text>
                                <View style={styles.cancelAndLogoutButtonWrapStyle}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => updateState({ isLogout: false })}
                                        style={styles.cancelButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.black15Bold }}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity activeOpacity={0.9}
                                        onPress={() => {
                                            updateState({ isLogout: false })
                                            navigation.push('auth/signinScreen')
                                        }}
                                        style={styles.logOutButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.white15Bold }}>Cerrar sesión</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        )
    }

    function editPasswordDialog() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={passwordDialog}
                onRequestClose={() => {
                    updateState({ passwordDialog: false })
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        updateState({ passwordDialog: false })
                    }}
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS == 'ios' ? 'padding' : null}
                        style={{ justifyContent: "center", flex: 1 }}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => { }}
                            style={styles.dialogContainerStyle}
                        >
                            <View style={{
                                backgroundColor: 'white', alignItems: 'center',
                            }}>
                                <Text style={{ ...Fonts.black20Bold, paddingBottom: Sizes.fixPadding * 3.0, }}>
                                    Cambiar tu contraseña
                                </Text>
                                <View style={{
                                    borderBottomColor: 'gray', borderBottomWidth: 0.50, width: '100%',
                                }}>
                                    <TextInput
                                        style={{ ...Fonts.black15Bold, paddingBottom: Sizes.fixPadding }}
                                        placeholder='Contraseña actual'
                                        placeholderTextColor={Colors.grayColor}
                                        secureTextEntry={true}
                                        cursorColor={Colors.primaryColor}
                                        selectionColor={Colors.primaryColor}
                                    />
                                </View>
                                <View style={{
                                    borderBottomColor: 'gray', borderBottomWidth: 0.50,
                                    width: '100%', marginTop: Sizes.fixPadding,
                                }}>
                                    <TextInput
                                        onChangeText={(value) => updateState({ changePassword: value })}
                                        style={{ ...Fonts.black15Bold, paddingBottom: Sizes.fixPadding }}
                                        placeholder='Nueva contraseña'
                                        placeholderTextColor={Colors.grayColor}
                                        secureTextEntry={true}
                                        cursorColor={Colors.primaryColor}
                                        selectionColor={Colors.primaryColor}
                                    />
                                </View>
                                <View style={{
                                    borderBottomColor: 'gray', borderBottomWidth: 0.50, width: '100%',
                                    marginTop: Sizes.fixPadding,
                                }}>
                                    <TextInput
                                        style={{ ...Fonts.black15Bold, paddingBottom: Sizes.fixPadding }}
                                        placeholder='Confirmar nueva contraseña'
                                        placeholderTextColor={Colors.grayColor}
                                        secureTextEntry={true}
                                        cursorColor={Colors.primaryColor}
                                        selectionColor={Colors.primaryColor}
                                    />
                                </View>
                                <View style={{
                                    flexDirection: 'row', alignItems: 'center',
                                    justifyContent: 'center', marginTop: Sizes.fixPadding * 2.0
                                }}>
                                    <TouchableOpacity activeOpacity={0.9}
                                        onPress={() => updateState({ passwordDialog: false })}
                                        style={styles.cancelButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.black15Bold }}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            updateState({
                                                passwordDialog: false,
                                                password: changePassword,
                                            })
                                        }}
                                        style={styles.okButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.white15Bold }}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>
        )
    }

    function editPhoneDialog() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={phoneDialog}
                onRequestClose={() => {
                    updateState({ phoneDialog: false })
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        updateState({ phoneDialog: false })
                    }}
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS == 'ios' ? 'padding' : null}
                        style={{ justifyContent: "center", flex: 1 }}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => { }}
                            style={styles.dialogContainerStyle}
                        >
                            <View style={{
                                backgroundColor: 'white', alignItems: 'center',
                            }}>
                                <Text style={{ ...Fonts.black20Bold, paddingBottom: Sizes.fixPadding * 3.0, }}>
                                    Cambiar número de teléfono
                                </Text>
                                <View style={{ borderBottomColor: 'gray', borderBottomWidth: 1.0, width: '100%' }}>
                                    <TextInput
                                        value={changePhone}
                                        onChangeText={(value) => updateState({ changePhone: value })}
                                        style={{ ...Fonts.black15Bold, paddingBottom: Sizes.fixPadding }}
                                        keyboardType="numeric"
                                        cursorColor={Colors.primaryColor}
                                        selectionColor={Colors.primaryColor}
                                    />
                                </View>
                                <View style={styles.okAndCancelButtonContainerStyle}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => updateState({ phoneDialog: false })}
                                        style={styles.cancelButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.black15Bold }}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            updateState({
                                                phoneDialog: false,
                                                phone: changePhone
                                            })
                                        }
                                        }
                                        style={styles.okButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.white15Bold }}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>
        )
    }

    function editEmailDialog() {
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={emailDialog}
                onRequestClose={() => {
                    updateState({ emailDialog: false })
                }}
            >
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {
                        updateState({ emailDialog: false })
                    }}
                    style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.2)" }}
                >
                    <KeyboardAvoidingView
                        behavior={Platform.OS == 'ios' ? 'padding' : null}
                        style={{ justifyContent: "center", flex: 1 }}
                    >
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => { }}
                            style={styles.dialogContainerStyle}
                        >
                            <View style={{
                                backgroundColor: 'white', alignItems: 'center',
                            }}>
                                <Text style={{ ...Fonts.black20Bold, paddingBottom: Sizes.fixPadding * 3.0, }}>
                                    Cambiar correo electrónico
                                </Text>
                                <View style={{ borderBottomColor: 'gray', borderBottomWidth: 1.0, width: '100%' }}>
                                    <TextInput
                                        value={changeEmail}
                                        onChangeText={(value) => updateState({ changeEmail: value })}
                                        style={{ ...Fonts.black15Bold, paddingBottom: Sizes.fixPadding }}
                                        cursorColor={Colors.primaryColor}
                                        selectionColor={Colors.primaryColor}
                                    />
                                </View>
                                <View style={styles.okAndCancelButtonContainerStyle}>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => updateState({ emailDialog: false })}
                                        style={styles.cancelButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.black15Bold }}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        activeOpacity={0.9}
                                        onPress={() => {
                                            updateState({
                                                emailDialog: false,
                                                email: changeEmail
                                            })
                                        }
                                        }
                                        style={styles.okButtonStyle}
                                    >
                                        <Text style={{ ...Fonts.white15Bold }}>Guardar</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </TouchableOpacity>
            </Modal>
        )
    }

    function logoutText() {
        return (
            <View>
                <Text style={{
                    ...Fonts.redColor20Bold,
                    alignSelf: 'center', marginTop: Sizes.fixPadding
                }}>
                    Cerrar sesión
                </Text>
                <View style={{ backgroundColor: '#F4473A', height: 1.0, marginVertical: Sizes.fixPadding }}></View>
            </View>
        )
    }

    function editInfo({ title, value }) {
        return (
            <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                        <Text style={{
                            ...Fonts.black17Bold,
                            marginTop: Sizes.fixPadding,
                            marginBottom: Sizes.fixPadding - 5.0
                        }}>
                            {title}
                        </Text>
                        <Text style={{ ...Fonts.gray15Bold }}>{value}</Text>
                    </View>
                    <MaterialIcons name="edit" size={30} color="#BDBDBD" />
                </View>
                <View style={{ backgroundColor: 'gray', height: 0.3, marginVertical: Sizes.fixPadding }}>
                </View>
            </View>
        )
    }

    function editProfileText() {
        return (
            <Text style={{ ...Fonts.gray18Bold, marginTop: Sizes.fixPadding * 2.0, marginBottom: Sizes.fixPadding }}>
                Editar perfil
            </Text>
        )
    }

    function userName() {
        return (
            <Text style={{
                ...Fonts.black20Bold, alignSelf: 'center',
                marginTop: Sizes.fixPadding - 3.0
            }}>
                Admin Hunter Price
            </Text>
        )
    }

    function userPhoto() {
        return (
            <Image
                source={require('../../assets/images/Logo Hunter Price.png')}
                style={{ height: 110.0, width: 110.0, borderRadius: 55.0, alignSelf: 'center', backgroundColor: Colors.whiteColor, padding: Sizes.fixPadding }}
                resizeMode="contain"
            />
        )
    }
}

const styles = StyleSheet.create({
    dialogContainerStyle: {
        backgroundColor: Colors.whiteColor,
        width: '85%',
        alignSelf: 'center',
        borderRadius: Sizes.fixPadding,
        padding: Sizes.fixPadding * 2.0
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
    okButtonStyle: {
        flex: 0.50,
        backgroundColor: Colors.primaryColor,
        borderRadius: Sizes.fixPadding - 5.0,
        paddingVertical: Sizes.fixPadding,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Sizes.fixPadding + 5.0
    },
    okAndCancelButtonContainerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Sizes.fixPadding * 2.0,
        marginHorizontal: Sizes.fixPadding + 5.0
    },
    logOutButtonStyle: {
        flex: 0.50,
        backgroundColor: Colors.primaryColor,
        borderRadius: Sizes.fixPadding - 5.0,
        paddingVertical: Sizes.fixPadding,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: Sizes.fixPadding + 5.0
    },
    cancelAndLogoutButtonWrapStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Sizes.fixPadding * 2.0,
        marginHorizontal: Sizes.fixPadding * 2.0,
    }
});

export default AccountSettingScreen;

