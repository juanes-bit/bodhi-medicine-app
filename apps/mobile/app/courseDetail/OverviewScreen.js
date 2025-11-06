import React from "react";
import { StyleSheet, View } from "react-native";
import { Sizes } from "../../constant/styles";
import OverviewTab from "../../src/courseDetail/OverviewTab";

export default function OverviewScreen() {
  return (
    <View style={styles.container}>
      <OverviewTab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Sizes.fixPadding * 2,
    paddingVertical: Sizes.fixPadding * 2,
  },
});
