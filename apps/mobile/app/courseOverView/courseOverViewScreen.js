import React, { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Text,
  View,
  FlatList,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Fonts, Sizes } from "../../constant/styles";
import { MaterialIcons } from "@expo/vector-icons";
import { listMyCourses, adaptCourseCard } from "../../src/_core/bodhi";
import { useRouter } from "expo-router";
import { useCourseDetail } from "../courseDetail/courseDetailContext";

const CourseOverViewScreen = () => {
  const { courseId, detail, progress } = useCourseDetail();
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const items = await listMyCourses();
        if (!cancelled) {
          setCourses(items.map((item, index) => adaptCourseCard(item, index)));
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.status === 401) {
          router.replace("/auth/signinScreen");
        } else {
          setError(String(err?.message || err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const modules = useMemo(() => {
    if (Array.isArray(detail?.modules) && detail.modules.length) {
      return detail.modules.map((module, idx) => ({
        id: String(module.id || idx),
        title: module.title || `Módulo ${idx + 1}`,
        schema: module.schema,
      }));
    }
    return [];
  }, [detail]);

  const learnData = useMemo(() => {
    if (modules.length) {
      return modules.map((module) => ({
        id: module.id,
        title: module.title,
      }));
    }
    if (courses.length) {
      return courses.slice(0, 4).map((course) => ({
        id: String(
          course.courseId ?? course.id ?? course.slug ?? course.courseName ?? Math.random(),
        ),
        title: course.courseCategory ?? course.courseName ?? "Curso Bodhi",
      }));
    }
    return [
      { id: "1", title: "Explora el curso completo" },
      { id: "2", title: "Recursos prácticos" },
      { id: "3", title: "Clases en video" },
      { id: "4", title: "Material descargable" },
    ];
  }, [modules, courses]);

  const progressSummary = useMemo(() => {
    if (!progress) return null;
    const pct = progress?.pct ?? 0;
    const total = progress?.total ?? 0;
    const done = progress?.done ?? 0;
    return { pct, total, done };
  }, [progress]);

  return (
    <View style={styles.container}>
      <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {courseSummary()}
        {divider()}
        {title({ title: "Resumen de tu progreso" })}
        {progressSummary ? progressInfo(progressSummary) : null}
        {divider()}
        {title({ title: "Qué obtendrás" })}
        {getFromCourseInfo({
          iconName: "menu",
          availability: `${modules.length || learnData.length} lecciones en video`,
        })}
        {getFromCourseInfo({
          iconName: "star-border",
          availability: "Materiales de aprendizaje exclusivos",
        })}
        {getFromCourseInfo({
          iconName: "check",
          availability: "Acceso garantizado mientras mantengas tu membresía",
        })}
        {divider()}
        {title({ title: "Lo que aprenderás" })}
        {loading ? (
          <ActivityIndicator
            color="#444"
            style={{ marginVertical: Sizes.fixPadding }}
          />
        ) : (
          learnFromCourse(learnData)
        )}
        {error ? (
          <Text style={{ ...Fonts.gray16Regular, marginTop: Sizes.fixPadding }}>
            {error}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );

  function learnFromCourse(list) {
    const renderItem = ({ item }) => (
      <ImageBackground
        source={require("../../assets/images/new_course/new_course_1.png")}
        style={{ height: 190.0, width: 190.0, marginRight: Sizes.fixPadding }}
        borderRadius={Sizes.fixPadding * 2.0}
        resizeMode="cover"
      >
        <View style={styles.learnFromImageBlurContainerStyle}>
          <Text style={{ ...Fonts.primaryColor23Bold }}>{item.title}</Text>
        </View>
      </ImageBackground>
    );

    return (
      <FlatList
        data={list}
        keyExtractor={(item) => `${item.id}`}
        renderItem={renderItem}
        horizontal
        contentContainerStyle={{
          paddingVertical: Sizes.fixPadding * 2.0,
        }}
      />
    );
  }

    function getFromCourseInfo({ iconName, availability }) {
        return (
            <View style={styles.getFromCourseInfoContainerStyle}>
                <MaterialIcons name={iconName} size={24} color="black" />
                <Text style={{ ...Fonts.black17Bold, marginLeft: Sizes.fixPadding * 2.0 }}>
                    {availability}
                </Text>
            </View>
        )
    }

    function title({ title }) {
        return (
            <Text style={{ ...Fonts.indigoColor18Bold }}>{title}</Text>
        )
    }

    function divider() {
        return (
            <View style={{
                backgroundColor: '#E1E1E1',
                height: 2.0,
                marginVertical: Sizes.fixPadding + 5.0
            }}>
            </View>
        )
    }

    function courseSummary() {
        const titleText = detail?.title ?? "Bodhi Medicine";
        const description =
            typeof detail?.summary === "string"
                ? detail.summary
                : detail?.excerpt?.rendered
                    ? stripHtml(detail.excerpt.rendered)
                    : "Explora el potencial de tu salud integrando cuerpo, mente y emociones.";
        return (
            <View>
                <Text style={{ ...Fonts.indigoColor18Bold, marginTop: Sizes.fixPadding * 2.0 }}>
                    {titleText}
                </Text>
                <Text style={{ ...Fonts.gray16Regular, marginTop: Sizes.fixPadding }}>
                    {description}
                </Text>
            </View>
        );
    }

    function progressInfo(summary) {
        return (
            <View style={{ marginVertical: Sizes.fixPadding }}>
                <Text style={{ ...Fonts.gray16Regular }}>
                    Progreso completado: {summary.pct}% ({summary.done}/{summary.total} lecciones)
                </Text>
            </View>
        );
    }

    function stripHtml(input) {
        if (typeof input !== "string") return "";
        return input.replace(/<[^>]*>?/gm, "").trim();
    }
}

const styles = StyleSheet.create({
    learnFromImageBlurContainerStyle: {
        backgroundColor: 'rgba(0, 0, 0, 0.30)',
        height: 190.0, width: 190.0,
        borderRadius: Sizes.fixPadding * 2.0,
        alignItems: 'flex-start',
        justifyContent: 'flex-end',
        paddingVertical: Sizes.fixPadding,
        paddingHorizontal: Sizes.fixPadding
    },
    getFromCourseInfoContainerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Sizes.fixPadding,
        marginHorizontal: Sizes.fixPadding + 5.0
    },
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: Sizes.fixPadding,
    }
})

export default CourseOverViewScreen;
