import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import useCourses from "./src/hooks/useCourses";
import useCourseDetail from "./src/hooks/useCourseDetail";
import LeccionScreen from "./src/screens/LeccionScreen";

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  const { data, isLoading, isError, error } = useCourses();

  if (isLoading) return <Text style={{ padding: 20 }}>Cargando cursos...</Text>;
  if (isError) return <Text style={{ color: "red" }}>Error: {error.message}</Text>;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate("DetalleCurso", { id: item.id })}
          style={{ padding: 12, borderBottomWidth: 1, borderColor: "#eee" }}
        >
          {item.cover && (
            <Image
              source={{ uri: item.cover }}
              style={{ width: "100%", height: 160, borderRadius: 8, marginBottom: 8 }}
              resizeMode="cover"
            />
          )}
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>{item.title}</Text>
          <Text>{item.excerpt}</Text>
        </TouchableOpacity>
      )}
    />
  );
}

function DetalleCursoScreen({ route, navigation }) {
  const { id } = route.params;
  const { data, isLoading, isError, error } = useCourseDetail(id);

  if (isLoading) return <Text style={{ padding: 20 }}>Cargando detalle...</Text>;
  if (isError) return <Text style={{ color: "red" }}>Error: {error.message}</Text>;

  return (
    <View style={{ flex: 1, padding: 16 }}>
      {data.cover && (
        <Image
          source={{ uri: data.cover }}
          style={{ width: "100%", height: 180, borderRadius: 8, marginBottom: 12 }}
          resizeMode="cover"
        />
      )}
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 12 }}>{data.title}</Text>
      <Text style={{ fontSize: 18, marginBottom: 8 }}>Lecciones:</Text>
      {data.lessons.map((ls, i) => (
        <Text
          key={i}
          onPress={() => navigation.navigate("Leccion", ls)}
          style={{ marginBottom: 12, fontWeight: "600" }}
        >
          • {ls.title} ({ls.type})
        </Text>
      ))}
    </View>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Cursos" component={HomeScreen} />
          <Stack.Screen name="DetalleCurso" component={DetalleCursoScreen} />
          <Stack.Screen name="Leccion" component={LeccionScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </QueryClientProvider>
  );
}
