import React, { useState } from "react";
import { Text, View, Dimensions, TouchableOpacity, StyleSheet } from "react-native";
import CollapsingToolbar from "../../component/sliverAppBar";
import { Fonts, Sizes, Colors } from "../../constant/styles";
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Switch, TouchableRipple } from 'react-native-paper';
import { Modal } from 'react-native-paper';
import MyStatusBar from "../../component/myStatusBar";
import { useNavigation } from "expo-router";

const { width } = Dimensions.get('screen');

const AppSettingScreen = () => {

    const navigation = useNavigation();

    const [state, setState] = useState({
        isSwitchOn: false,
        isDeleteCompltedLesson: true,
        nothingToDeleteDialog: false,
        videoDownloadInHigh: false,
    })

    const updateState = (data) => setState((state) => ({ ...state, ...data }))

    const {
        isSwitchOn,
        isDeleteCompltedLesson,
        nothingToDeleteDialog,
        videoDownloadInHigh,
    } = state;

    return (
        <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
            <MyStatusBar />
            <CollapsingToolbar
                leftItem={
                    <MaterialIcons
                        name="arrow-back-ios"
                        size={25}
                        color={Colors.blackColor}
                        onPress={() => navigation.pop()}
                    />
                }
                element={<Text style={{ ...Fonts.black25Bold }}>App Settings</Text>}
                toolbarColor={Colors.primaryColor}
                toolBarMinHeight={40}
                toolbarMaxHeight={230}
                childrenMinHeight={730}
                src={require('../../assets/images/appbar_bg.png')}>
                <View style={{
                    marginHorizontal: Sizes.fixPadding * 2.0,
                    marginTop: Sizes.fixPadding * 4.0
                }}>
                    {cellularDataInfo()}
                    {divider()}
                    {videoQualityForDownloadsInfo()}
                    {offlineDownloadsInfo()}
                    {deleteAllDownloadsInfo()}
                </View>
            </CollapsingToolbar>
            {nothingToDeleteInfo()}
        </View>
    )

    function nothingToDeleteInfo() {
        return (
            <Modal
                visible={nothingToDeleteDialog}
                onDismiss={() => { updateState({ nothingToDeleteDialog: false }) }}
                contentContainerStyle={styles.dialogContainerStyle}
            >
                <View style={{ backgroundColor: 'white', alignItems: 'center', }}>
                    <Text style={{ ...Fonts.redColor20Bold, paddingBottom: Sizes.fixPadding - 5.0, }}>
                        Nothing to Delete
                    </Text>
                    <MaterialCommunityIcons name="timer-sand-empty" size={60}
                        color={Colors.primaryColor}
                        style={{ marginVertical: Sizes.fixPadding * 2.0 }}
                    />
                    <Text style={{
                        ...Fonts.lightGrayColor15Bold, textAlign: 'center',
                        marginBottom: Sizes.fixPadding * 2.0,
                    }}>
                        There are no downloded lessons on your device
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            updateState({ nothingToDeleteDialog: false, })
                        }}
                        style={styles.okButtonStyle}
                    >
                        <Text style={{ ...Fonts.white15Bold }}>Okay</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        )
    }

    function deleteAllDownloadsInfo() {
        return (
            <View style={{ marginTop: Sizes.fixPadding }}>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => updateState({ nothingToDeleteDialog: true })}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                    <View style={{ width: width - 100.0, }}>
                        <Text style={{ ...Fonts.redColor20Bold }}>
                            Delete All Downloads
                        </Text>
                        <Text style={{ ...Fonts.lightGrayColor15Bold, marginTop: Sizes.fixPadding }}>
                            This will remove all downloaded Lesson videos from your phone
                        </Text>
                    </View>
                    <MaterialIcons name="delete" size={28} color='#F4473A' />
                </TouchableOpacity>
                <View style={styles.redDividerStyle}>
                </View>
            </View>
        )
    }

    function offlineDownloadsInfo() {
        return (
            <View style={{ marginTop: Sizes.fixPadding }}>
                <Text style={{ ...Fonts.lightGrayColor21Bold, }}>
                    Offline Downloads
                </Text>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => updateState({ isDeleteCompltedLesson: !isDeleteCompltedLesson })}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: Sizes.fixPadding + 5.0
                    }}>
                    <View style={{ width: width - 100.0, }}>
                        <Text style={{ ...Fonts.black17Bold }}>
                            Delete Completed Lessons
                        </Text>
                        <Text style={{ ...Fonts.lightGrayColor15Bold, marginTop: Sizes.fixPadding }}>
                            Lessons can automatically delete 24 hours after they are watched in full
                        </Text>
                    </View>
                    {
                        isDeleteCompltedLesson ?
                            <MaterialIcons name="done" size={25} color="black" />
                            :
                            null
                    }
                </TouchableOpacity>
                {divider()}
            </View>
        )
    }

    function videoQualityForDownloadsInfo() {
        return (
            <View style={{ marginTop: Sizes.fixPadding }}>
                <Text style={{ ...Fonts.lightGrayColor21Bold, }}>
                    Video Quality for Downloads
                </Text>
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => updateState({ videoDownloadInHigh: false })}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: Sizes.fixPadding + 5.0
                    }}>
                    <View style={{ width: width - 100.0, }}>
                        <Text style={{ ...Fonts.black17Bold }}>
                            Standard (recommended)
                        </Text>
                        <Text style={{ ...Fonts.lightGrayColor15Bold, marginTop: Sizes.fixPadding }}>
                            Downloads faster and uses less storage</Text>
                    </View>
                    {
                        videoDownloadInHigh ?
                            null :
                            <MaterialIcons name="done" size={25} color="black" />
                    }
                </TouchableOpacity>
                {divider()}
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => updateState({ videoDownloadInHigh: true })}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                    <View style={{ width: width - 100.0, }}>
                        <Text style={{ ...Fonts.black17Bold }}>High Definition</Text>
                        <Text style={{ ...Fonts.lightGrayColor15Bold, marginTop: Sizes.fixPadding }}>
                            Use more storage
                        </Text>
                    </View>
                    {
                        videoDownloadInHigh ?
                            <MaterialIcons name="done" size={25} color="black" />
                            :
                            null
                    }
                </TouchableOpacity>
                {divider()}
            </View>
        )
    }

    function divider() {
        return (
            <View style={{
                height: 0.5, backgroundColor: 'gray',
                marginVertical: Sizes.fixPadding + 5.0
            }}>
            </View>
        )
    }

    function cellularDataInfo() {
        return (
            <View>
                <Text style={{ ...Fonts.lightGrayColor21Bold }}>Cellular Data</Text>
                <View style={styles.cellularDataInfoContainerStyle}>
                    <Text style={{ ...Fonts.black17Bold }}>Cellular Data for Downloads</Text>
                    <TouchableRipple
                        rippleColor="transparent"
                        onPress={() => updateState({ isSwitchOn: !isSwitchOn })}
                    >
                        <View pointerEvents="none">
                            <Switch
                                value={isSwitchOn}
                                color={isSwitchOn ? Colors.primaryColor : '#E6E6E7'}
                            />
                        </View>
                    </TouchableRipple>
                </View>
            </View>
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
    okButtonStyle: {
        width: '100%',
        backgroundColor: Colors.primaryColor,
        borderRadius: Sizes.fixPadding - 5.0,
        paddingVertical: Sizes.fixPadding,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: Sizes.fixPadding + 5.0
    },
    redDividerStyle: {
        height: 1.5,
        backgroundColor: '#F4473A',
        marginVertical: Sizes.fixPadding + 5.0
    },
    cellularDataInfoContainerStyle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Sizes.fixPadding
    }
})

export default AppSettingScreen;