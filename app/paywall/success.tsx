"use client"

import { useEffect } from "react"
import { View } from "react-native"
import { router } from "expo-router"
import { CheckCircle, Star, ArrowRight } from "lucide-react-native"
import { SafeArea } from "../../src/components/layout/SafeArea"
import { Text } from "../../src/components/ui/Text"
import { Button } from "../../src/components/ui/Button"
import { Card } from "../../src/components/ui/Card"
import { usePaymentSuccess } from "../../src/hooks/usePayment"

export default function PaymentSuccessScreen() {
  const { handlePaymentSuccess } = usePaymentSuccess()

  useEffect(() => {
    // Refresh user data when payment is successful
    handlePaymentSuccess().catch((error) => {
      console.error("Error handling payment success:", error)
    })
  }, [handlePaymentSuccess])

  const handleContinue = () => {
    router.replace("/(tabs)/courses")
  }

  const handleViewProfile = () => {
    router.replace("/(tabs)/profile")
  }

  return (
    <SafeArea>
      <View className="flex-1 justify-center items-center px-6">
        {/* Success Icon */}
        <View className="w-24 h-24 bg-green-100 rounded-full items-center justify-center mb-8">
          <CheckCircle size={48} color="#10b981" />
        </View>

        {/* Success Message */}
        <Text variant="h2" className="text-center mb-4">
          ¡Pago exitoso!
        </Text>

        <Text variant="body" className="text-center text-muted-foreground mb-8 max-w-sm">
          Tu membresía premium ha sido activada. Ya puedes acceder a todo el contenido exclusivo.
        </Text>

        {/* Benefits Card */}
        <Card className="w-full max-w-sm mb-8 bg-primary-50 border-primary-200">
          <View className="items-center py-4">
            <View className="w-12 h-12 bg-primary-600 rounded-full items-center justify-center mb-3">
              <Star size={24} color="white" />
            </View>
            <Text variant="body" className="font-semibold text-primary-900 mb-2">
              Medicina con Amor Premium
            </Text>
            <Text variant="caption" className="text-primary-700 text-center">
              Acceso completo desbloqueado
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View className="w-full max-w-sm space-y-3">
          <Button onPress={handleContinue} className="flex-row items-center justify-center">
            <Text className="text-white font-semibold mr-2">Explorar cursos</Text>
            <ArrowRight size={20} color="white" />
          </Button>

          <Button variant="outline" onPress={handleViewProfile}>
            Ver mi perfil
          </Button>
        </View>

        {/* Additional Info */}
        <Text variant="caption" className="text-center text-muted-foreground mt-8 max-w-sm">
          Recibirás un email de confirmación con los detalles de tu suscripción.
        </Text>
      </View>
    </SafeArea>
  )
}
