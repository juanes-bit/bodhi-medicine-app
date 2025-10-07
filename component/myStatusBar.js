import { SafeAreaView, StatusBar } from "react-native";
import React from "react";
import { Colors } from "../constant/styles";

const MyStatusBar = () => {
  return (
    <SafeAreaView style={{ backgroundColor: Colors.primaryColor }}>
      <StatusBar
        translucent={false}
        backgroundColor={Colors.primaryColor}
        barStyle={"dark-content"}
      />
    </SafeAreaView>
  );
};

export default MyStatusBar;