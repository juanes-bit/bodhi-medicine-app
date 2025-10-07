import React, { useEffect } from "react";
import { Text, View } from "react-native";
import { Fonts, Colors } from "../constant/styles";
import MyStatusBar from "../component/myStatusBar";
import { useNavigation } from "expo-router";

const SplashScreen = () => {

    const navigation = useNavigation();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.push('onBoarding/onBoardingScreen');
        }, 2000);
        return () => {
            clearTimeout(timer);
        }
    }, [])

    return (
        <View style={{ flex: 1, backgroundColor: Colors.primaryColor }} >
            <MyStatusBar />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ ...Fonts.white60Regular }}>
                    Welcome
                </Text>
            </View>
        </View>
    )
}

export default SplashScreen;