import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

const Skeleton = ({ style }) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
    };
  }, [animation]);

  const backgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["#e5e9f2", "#f2f4f8"],
  });

  return <Animated.View style={[styles.base, style, { backgroundColor }]} />;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
  },
});

export default Skeleton;
