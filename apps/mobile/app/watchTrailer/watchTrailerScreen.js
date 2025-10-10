import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  Dimensions,
  Image,
} from "react-native";
import { Colors, Fonts, Sizes } from "../../constant/styles";
import CollapsingToolbar from "../../component/sliverAppBar";
import { MaterialIcons } from "@expo/vector-icons";
import MyStatusBar from "../../component/myStatusBar";
import { useNavigation } from "expo-router";
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get("screen");

const courseLessonsList = [
  {
    id: "2",
    image: require("../../assets/images/new_course/new_course_2.png"),
    title: "Lesson 1",
    descritption:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
    isLoack: true,
  },
  {
    id: "3",
    image: require("../../assets/images/new_course/new_course_3.png"),
    title: "Lesson 2",
    descritption:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
    isLoack: true,
  },
  {
    id: "4",
    image: require("../../assets/images/new_course/new_course_4.png"),
    title: "Lesson 3",
    descritption:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
    isLoack: true,
  },
  {
    id: "5",
    image: require("../../assets/images/new_course/new_course_5.png"),
    title: "Lesson 4",
    descritption:
      "Lorem Ipsum is simply dummy text of the printing and typesetting industry",
    isLoack: false,
  },
];

const ShowVideo = ({ isPlay }) => {

  const videoSource =
    'http://139.59.39.129/video/BigBuckBunny.mp4';

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.play();
  });

  return (
    <View style={styles.videoContainerStyle}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        contentFit='cover'
      />
    </View>
  );
};

const WatchTrailerScreen = () => {

  const navigation = useNavigation();

  const [isPlay, setisPlay] = useState(true);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setisPlay(true);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      setisPlay(false);
    });

    return unsubscribe;
  }, [navigation]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <MyStatusBar />
      <CollapsingToolbar
        leftItem={
          <MaterialIcons
            name="arrow-back-ios"
            size={24}
            color={Colors.whiteColor}
            onPress={() => navigation.pop()}
          />
        }
        element={<ShowVideo isPlay={isPlay} />}
        toolbarColor={Colors.primaryColor}
        toolBarMinHeight={40}
        toolbarMaxHeight={250}
        isImage={false}
        childrenMinHeight={730}
      >
        <View
          style={{
            paddingTop: Sizes.fixPadding * 3.0,
            paddingBottom: Sizes.fixPadding,
          }}
        >
          <Text
            style={{
              ...Fonts.black25Bold,
              marginHorizontal: Sizes.fixPadding + 5.0,
            }}
          >
            Trailer
          </Text>
          <Text
            style={{
              ...Fonts.gray19Regular,
              marginHorizontal: Sizes.fixPadding + 5.0,
              marginVertical: Sizes.fixPadding + 3.0,
            }}
          >
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry.
          </Text>
          {courseLessonsList.map((item) => renderItem({ item }))}
        </View>
      </CollapsingToolbar>
    </View>
  );

  function renderItem({ item }) {
    return (
      <View key={item.id}>
        <View style={styles.lessonInfoContainerStyle}>
          <Image
            source={item.image}
            style={styles.lessonInfoImageStyle}
            resizeMode="cover"
          />
          <View
            style={{
              marginLeft: Sizes.fixPadding,
              width: width - 140,
              marginVertical: 3.0,
            }}
          >
            <Text style={{ ...Fonts.black17Bold }}>{item.title}</Text>
            <Text
              style={{
                ...Fonts.gray16Regular,
                marginVertical: Sizes.fixPadding,
              }}
            >
              {item.descritption}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {item.isLoack ? (
                <MaterialIcons name="lock" size={22} color="black" />
              ) : (
                <MaterialIcons name="lock-open" size={22} color="black" />
              )}
              <Text
                style={{ ...Fonts.blackRegular, marginLeft: Sizes.fixPadding }}
              >
                {item.isLoack ? "Locked" : "Unlocked"}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  videoContainerStyle: {
    backgroundColor: Colors.whiteColor
  },
  video: {
    width: width,
    height: 250,
  },
  lessonInfoContainerStyle: {
    flexDirection: "row",
    marginVertical: Sizes.fixPadding + 7.0,
    alignItems: "center",
  },
  lessonInfoImageStyle: {
    height: 110.0,
    width: 110.0,
    borderRadius: Sizes.fixPadding * 2.0,
    marginLeft: Sizes.fixPadding,
  },
});

export default WatchTrailerScreen;
