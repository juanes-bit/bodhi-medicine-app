"use client"

import React from "react"

import { useState, useRef } from "react"
import { View, Alert } from "react-native"
import { WebView, type WebViewNavigation } from "react-native-webview"
import { router } from "expo-router"
import { ArrowLeft, X } from "lucide-react-native"
import { SafeArea } from "../../src/components/layout/SafeArea"
import { Text } from "../../src/components/ui/Text"
import { Button } from "../../src/components/ui/Button"
import { BodhiAPI } from "../../src/api/sdk"
import { useAuthStore } from "../../src/store/auth"

export default function CheckoutScreen() {
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const webViewRef = useRef<WebView>(null)
  const { user } = useAuthStore()

  const initializeCheckout = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await BodhiAPI.createCheckoutSession()
      setCheckoutUrl(response.url)
    } catch (error: any) {
      setError(error.message || "Error al inicializar el checkout")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState

    // Handle successful payment
    if (url.includes("bodhi://checkout/success")) {
      Alert.alert("¡Pago exitoso!", "Tu membresía ha sido activada. Ya puedes acceder a todo el contenido premium.", [
        {
          text: "Continuar",
          onPress: () => {
            // Refresh user data and navigate to profile
            router.replace("/(tabs)/profile")
          },
        },
      ])
      return
    }

    // Handle cancelled payment
    if (url.includes("bodhi://checkout/cancel") || url.includes("cancel")) {
      Alert.alert("Pago cancelado", "El proceso de pago fue cancelado.", [
        {
          text: "Volver",
          onPress: () => router.back(),
        },
      ])
      return
    }
  }

  const handleClose = () => {
    Alert.alert("Cancelar pago", "¿Estás seguro de que quieres cancelar el proceso de pago?", [
      { text: "Continuar pagando", style: "cancel" },
      {
        text: "Cancelar",
        style: "destructive",
        onPress: () => router.back(),
      },
    ])
  }

  // Initialize checkout on mount
  React.useEffect(() => {
    initializeCheckout()
  }, [])

  if (isLoading) {
    return (
      <SafeArea>
        <View className="flex-1 justify-center items-center px-6">
          <Text variant="h3" className="mb-4 text-center">
            Preparando checkout...
          </Text>
          <Text variant="body" className="text-muted-foreground text-center">
            Estamos configurando tu proceso de pago seguro
          </Text>
        </View>
      </SafeArea>
    )
  }

  if (error) {
    return (
      <SafeArea>
        <View className="flex-1 justify-center items-center px-6">
          <Text variant="h3" className="mb-4 text-center text-red-600">
            Error en el checkout
          </Text>
          <Text variant="body" className="text-muted-foreground text-center mb-8">
            {error}
          </Text>
          <View className="space-y-3 w-full max-w-sm">
            <Button onPress={initializeCheckout}>Reintentar</Button>
            <Button variant="outline" onPress={() => router.back()}>
              Volver
            </Button>
          </View>
        </View>
      </SafeArea>
    )
  }

  return (
    <SafeArea edges={["top"]}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4 border-b border-border bg-white">
          <View className="flex-row items-center">
            <Button variant="ghost" size="icon" onPress={() => router.back()}>
              <ArrowLeft size={20} color="#374151" />
            </Button>
            <Text variant="body" className="ml-2 font-medium">
              Checkout seguro
            </Text>
          </View>

          <Button variant="ghost" size="icon" onPress={handleClose}>
            <X size={20} color="#374151" />
          </Button>
        </View>

        {/* WebView */}
        {checkoutUrl && (
          <WebView
            ref={webViewRef}
            source={{ uri: checkoutUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            startInLoadingState
            renderLoading={() => (
              <View className="flex-1 justify-center items-center">
                <Text variant="body" className="text-muted-foreground">
                  Cargando checkout...
                </Text>
              </View>
            )}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent
              setError(`Error al cargar el checkout: ${nativeEvent.description}`)
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent
              setError(`Error HTTP: ${nativeEvent.statusCode}`)
            }}
            // Security settings
            javaScriptEnabled
            domStorageEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            // iOS specific
            allowsBackForwardNavigationGestures={false}
            // Android specific
            mixedContentMode="compatibility"
            thirdPartyCookiesEnabled
          />
        )}
      </View>
    </SafeArea>
  )
}
