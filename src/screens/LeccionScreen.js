import React from "react";
import { View, Text, Alert } from "react-native";
import { WebView } from "react-native-webview";

export default function LeccionScreen({ route }) {
  const { title, type, url } = route.params;

  // Si es HTTP (no HTTPS), algunos contenidos no cargan; ábrelo fuera o habilita cleartext más adelante.
  const isHttp = url?.startsWith("http://");
  if (!url) return <Text style={{ padding: 16 }}>Sin URL</Text>;
  if (isHttp) Alert.alert("Aviso", "Abriré el contenido en el navegador por ser HTTP.");

  return isHttp
    ? <Text style={{ padding: 16 }}>Pulsa el enlace desde el detalle (por ahora HTTP externo).</Text>
    : (
      <View style={{ flex: 1 }}>
        <WebView source={{ uri: url }} />
      </View>
    );
}
