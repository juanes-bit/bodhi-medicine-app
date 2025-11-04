import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  BackHandler,
  FlatList
} from "react-native";
import { Colors, Fonts, Sizes } from "../../constant/styles";
import { useFocusEffect } from "@react-navigation/native";
import MyStatusBar from "../../component/myStatusBar";
import { useNavigation } from "expo-router";

const { width } = Dimensions.get("screen");

const onboardingScreenList = [
  {
    id: "1",
    onboardingImage: require("../../assets/images/onboarding/1.jpg"),
    onboardingTitle: "Aprende de los mejores",
    onboardingDescription: 'Formación guiada por especialistas de Bodhi Medicine para ayudarte a vivir un nuevo paradigma de salud consciente.',
  },
  {
    id: "2",
    onboardingImage: require("../../assets/images/onboarding/2.jpg"),
    onboardingTitle: "Descargar y ver en cualquier momento",
    onboardingDescription: 'Descarga hasta 10 lecciones fáciles de asimilar que podrás ver sin conexión en cualquier momento.',
  },
  {
    id: "3",
    onboardingImage: require("../../assets/images/onboarding/3.jpg"),
    onboardingTitle: "Explora una amplia gama de cursos de Bodhi Medicine",
    onboardingDescription: 'Profundiza en Bodhi Medicine, HeartMath y bienestar integral con recursos diseñados para acompañar tu bienestar.',
  },
];

const OnBoardingScreen = () => {

  const navigation = useNavigation();

  const [backClickCount, setBackClickCount] = useState(0);
  const [currentScreen, setCurrentScreen] = useState(0);
  const resetTimerRef = useRef(null);
  const listRef = useRef(null);

  const triggerBackHint = useCallback(() => {
    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }
    setBackClickCount(1);
    resetTimerRef.current = setTimeout(() => {
      setBackClickCount(0);
      resetTimerRef.current = null;
    }, 1000);
  }, []);

  const backAction = useCallback(() => {
    if (backClickCount === 1) {
      BackHandler.exitApp();
    } else {
      triggerBackHint();
    }
    return true;
  }, [backClickCount, triggerBackHint]);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => {
        backHandler.remove();
      };
    }, [backAction]),
  );

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const scrollToIndex = ({ index }) => {
    listRef.current?.scrollToIndex({ animated: true, index });
    setCurrentScreen(index);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.whiteColor }}>
      <MyStatusBar />
      <View style={{ flex: 1 }}>
        {onboardingContent()}
      </View>
      {currentScreen === 2 ? getStartedButton() : skipAndNextButton()}
      {exitInfo()}
    </View>
  );

  function getStartedButton() {
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { navigation.push('auth/signinScreen') }}
        style={styles.getStartedButton}
      >
        <Text style={{ ...Fonts.white16Bold }}>
          COMENZAR AHORA
        </Text>
      </TouchableOpacity>
    )
  }

  function skipAndNextButton() {
    return (
      <View style={styles.skipAndNextButtonWrapper}>
        <Text
          onPress={() => { scrollToIndex({ index: 2 }) }}
          style={{ ...Fonts.primaryColor16Regular }}
        >
          OMITIR
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {onboardingScreenList.map((item, index) => (
            <View
              key={`${item.id}`}
              style={{
                width: currentScreen === index ? 11.0 : 7.0,
                height: currentScreen === index ? 11.0 : 7.0,
                borderRadius: currentScreen === index ? 5.5 : 3.5,
                backgroundColor:
                  currentScreen === index
                    ? 'rgba(0, 0, 0, 0.4)'
                    : 'rgba(0, 0, 0, 0.2)',
                marginHorizontal: Sizes.fixPadding - 8.0,
                opacity: currentScreen === index ? 1 : 0.6,
              }}
            ></View>
          ))}
        </View>
        <Text
          onPress={() => { scrollToIndex({ index: currentScreen + 1 }) }}
          style={{ ...Fonts.primaryColor16Regular }}
        >
          SIGUIENTE
        </Text>
      </View>
    )
  }

  function onScrollEnd(e) {
    let contentOffset = e.nativeEvent.contentOffset;
    let viewSize = e.nativeEvent.layoutMeasurement;
    let pageNum = Math.floor(contentOffset.x / viewSize.width);
    setCurrentScreen(pageNum);
  }

  function onboardingContent() {
    const renderItem = ({ item }) => {
      return (
        <View style={styles.onboardingContentStyle}>
          <Text
            numberOfLines={1}
            style={{
              ...Fonts.black25Bold,
              textAlign: 'center',
              marginHorizontal: Sizes.fixPadding * 2.0
            }}
          >
            {item.onboardingTitle}
          </Text>
          <Image
            source={item.onboardingImage}
            style={{ width: "100%", height: width / 1.5, resizeMode: 'contain' }}
          />
          <Text
            numberOfLines={2}
            style={styles.descriptionTextStyle}
          >
            {item.onboardingDescription}
          </Text>
        </View>
      );
    };
    return (
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          data={onboardingScreenList}
          keyExtractor={(item) => `${item.id}`}
          renderItem={renderItem}
          horizontal
          scrollEventThrottle={32}
          pagingEnabled
          onMomentumScrollEnd={onScrollEnd}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  }

  function exitInfo() {
    return (
      backClickCount === 1 ? (
        <View style={styles.animatedView}>
          <Text style={{ ...Fonts.white15Regular }}>
            Press Back Once Again to Exit
          </Text>
        </View>
      ) : null
    )
  }
};

const styles = StyleSheet.create({
  skipAndNextButtonWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAFAFA',
    padding: Sizes.fixPadding * 2.0
  },
  descriptionTextStyle: {
    ...Fonts.gray16Regular,
    textAlign: 'center',
    marginHorizontal: Sizes.fixPadding * 2.0,
    marginTop: Sizes.fixPadding * 4.0
  },
  onboardingContentStyle: {
    flex: 1,
    width: width,
    height: "100%",
    overflow: "hidden",
    justifyContent: 'center'
  },
  animatedView: {
    backgroundColor: "#333333",
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    borderRadius: Sizes.fixPadding * 2.0,
    paddingHorizontal: Sizes.fixPadding + 5.0,
    paddingVertical: Sizes.fixPadding,
    justifyContent: "center",
    alignItems: "center",
  },
  getStartedButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Sizes.fixPadding * 2.0,
    backgroundColor: Colors.primaryColor
  }
});

export default OnBoardingScreen;
