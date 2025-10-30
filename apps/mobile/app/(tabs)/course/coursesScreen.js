import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View, StyleSheet, Dimensions, Image, ScrollView } from "react-native";
import { Fonts, Sizes, Colors, CommonStyles } from "../../../constant/styles";
import CollapsingToolbar from "../../../component/sliverAppBar";
import { listMyCourses } from "../../../src/_core/bodhi";

const { width } = Dimensions.get('screen');

const CoursesScreen = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { itemsOwned } = await listMyCourses();
        if (mounted) {
          setCourses(itemsOwned);
        }
      } catch (err) {
        if (mounted) {
          setError(String(err?.message || err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const renderItem = (item) => {
    const placeholder = require("../../../assets/images/new_course/new_course_4.png");
    const imageSource =
      typeof item.image === "string" && item.image
        ? { uri: item.image }
        : item.image || placeholder;

    return (
      <View key={item.id ?? item.title} style={styles.courseContainerStyle}>
        <Image
          source={imageSource}
          style={styles.courseImageStyle}
          resizeMode="cover"
        />
        <View style={styles.courseInfoContainerStyle}>
          <Text style={{ ...Fonts.black17Bold }}>{item.title || "Curso"}</Text>
          {item.summary ? (
            <Text
              style={{ ...Fonts.gray16Regular, marginVertical: Sizes.fixPadding - 3.0 }}
              numberOfLines={3}
            >
              {item.summary}
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.feedbackContainer}>
          <ActivityIndicator color={Colors.primaryColor} size="small" />
          <Text style={{ ...Fonts.gray16Regular, marginTop: Sizes.fixPadding }}>
            Cargando tus cursos...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.feedbackContainer}>
          <Text style={{ ...Fonts.gray16Regular }}>{error}</Text>
        </View>
      );
    }

    if (!courses.length) {
      return (
        <View style={styles.feedbackContainer}>
          <Text style={{ ...Fonts.gray16Regular }}>
            Aún no tienes cursos adquiridos.
          </Text>
        </View>
      );
    }

    return courses.map(renderItem);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAFA" }}>
      <CollapsingToolbar
        element={
          <Text style={{ ...Fonts.black25Bold, color: Colors.whiteColor }}>
            Mis Cursos
          </Text>
        }
        toolbarColor={Colors.primaryColor}
        toolBarMinHeight={40}
        toolbarMaxHeight={230}
        src={require("../../../assets/images/appbar_bg.png")}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: Sizes.fixPadding, paddingBottom: Sizes.fixPadding * 2 }}
          showsVerticalScrollIndicator={false}
        >
          {renderContent()}
        </ScrollView>
      </CollapsingToolbar>
    </View>
  );
};

const styles = StyleSheet.create({
    courseContainerStyle: {
        flexDirection: 'row',
        width: width - 20,
        elevation: 2.0,
        ...CommonStyles.shadow,
        backgroundColor: Colors.whiteColor,
        paddingVertical: Sizes.fixPadding + 5.0,
        borderRadius: Sizes.fixPadding * 2.0,
        alignSelf: 'center',
        marginVertical: Sizes.fixPadding,
        alignItems: 'center'
    },
    courseImageStyle: {
        height: 115.0,
        width: 115.0,
        borderRadius: Sizes.fixPadding * 2.0,
        marginLeft: Sizes.fixPadding
    },
    courseInfoContainerStyle: {
        marginLeft: Sizes.fixPadding,
        width: width - 160,
        marginVertical: 3.0,
    },
});

export default CoursesScreen;
