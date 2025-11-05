
import React, { useState } from "react";
import { Text, useWindowDimensions, } from "react-native";
import { TabView, TabBar } from 'react-native-tab-view';
import { Fonts, Colors } from "../constant/styles";
import CourseOverViewScreen from "../app/courseDetail/OverviewScreen";
import CourseLessonsScreen from "../app/courseLessons/courseLessonsScreen";

export default TabBarScreen = ({ navigation, setshowAccessDialog }) => {

    const [index, setIndex] = useState(0);
    const [routes] = useState([
        { key: 'first', title: 'OverView' },
        { key: 'second', title: 'Lessons' },
    ]);

    const layout = useWindowDimensions();

    const renderScene = ({ route, jumpTo }) => {
        switch (route.key) {
            case 'first':
                return <CourseOverViewScreen />;
            case 'second':
                return <CourseLessonsScreen setshowAccessDialog={setshowAccessDialog} />;
        }
    };

    return (
        <TabView
            navigationState={{ index, routes }}
            renderScene={renderScene}
            onIndexChange={setIndex}
            commonOptions={{
                label: ({ route }) => (
                    <Text style={{ ...Fonts.black17Bold }}>
                        {route.title}
                    </Text>
                )
            }}
            renderTabBar={props => (
                <TabBar
                    {...props}
                    indicatorStyle={{ backgroundColor: Colors.orangeColor, }}
                    tabStyle={{
                        width: layout.width / 2,
                    }}
                    style={{
                        backgroundColor: Colors.whiteColor,
                        borderBottomWidth: 1,
                        borderBottomColor: '#dddddd',
                        elevation: 0
                    }}
                />
            )}
        />
    )
}