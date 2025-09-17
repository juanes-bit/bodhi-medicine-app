"use client"

import { ScrollView, View } from "react-native"
import { router } from "expo-router"
import { Crown, Check, Star, Zap, Shield, Users } from "lucide-react-native"
import { SafeArea } from "../../../src/components/layout/SafeArea"
import { Text } from "../../../src/components/ui/Text"
import { Button } from "../../../src/components/ui/Button"
import { Card } from "../../../src/components/ui/Card"
import { Badge } from "../../../src/components/ui/Badge"
import { useAuthStore } from "../../../src/store/auth"
import { t } from "../../../src/lib/i18n"

const MEMBERSHIP_BENEFITS = [
  {
    icon: <Crown size={24} color="#f59e0b" />,
    title: "Acceso completo",
    description: "Todos los cursos y contenido premium",
  },
  {
    icon: <Zap size={24} color="#3b82f6" />,
    title: "Contenido exclusivo",
    description: "Masterclasses y talleres especiales",
  },
  {
    icon: <Users size={24} color="#10b981" />,
    title: "Comunidad privada",
    description: "Acceso al grupo exclusivo de miembros",
  },
  {
    icon: <Shield size={24} color="#8b5cf6" />,
    title: "Soporte prioritario",
    description: "Respuesta rápida a tus consultas",
  },
]

export default function MembershipScreen() {
  const { user } = useAuthStore()
  const hasMembership = user?.membership === "medicina_con_amor"

  const handleUpgrade = () => {
    router.push("/paywall/checkout")
  }

  return (
    <SafeArea>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text variant="h2" className="mb-2">
            {t("nav.membership")}
          </Text>
          <Text variant="body" className="text-muted-foreground">
            Desbloquea todo el potencial de tu aprendizaje
          </Text>
        </View>

        {/* Current Status */}
        <View className="px-6 mb-8">
          <Card className={hasMembership ? "bg-yellow-50 border-yellow-200" : "bg-muted/50"}>
            <View className="flex-row items-center">
              <View
                className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${hasMembership ? "bg-yellow-500" : "bg-muted"}`}
              >
                <Crown size={24} color={hasMembership ? "white" : "#9ca3af"} />
              </View>
              <View className="flex-1">
                <Text variant="body" className="font-semibold mb-1">
                  {hasMembership ? "Medicina con Amor - Activa" : "Membresía Básica"}
                </Text>
                <Text variant="caption" className={hasMembership ? "text-yellow-700" : "text-muted-foreground"}>
                  {hasMembership
                    ? "Tienes acceso completo a todo el contenido"
                    : "Acceso limitado a contenido gratuito"}
                </Text>
              </View>
              {hasMembership && (
                <Badge variant="warning">
                  <Star size={12} color="#f59e0b" />
                  <Text className="ml-1 text-yellow-800">Premium</Text>
                </Badge>
              )}
            </View>
          </Card>
        </View>

        {!hasMembership && (
          <>
            {/* Membership Plan */}
            <View className="px-6 mb-8">
              <Card className="bg-gradient-to-br from-primary-50 to-secondary-50 border-primary-200">
                <View className="text-center items-center mb-6">
                  <View className="w-16 h-16 bg-primary-600 rounded-full items-center justify-center mb-4">
                    <Crown size={32} color="white" />
                  </View>
                  <Text variant="h3" className="text-primary-900 mb-2">
                    Medicina con Amor
                  </Text>
                  <Text variant="body" className="text-primary-700 text-center mb-4">
                    Membresía premium con acceso completo
                  </Text>
                  <View className="flex-row items-baseline">
                    <Text variant="h2" className="text-primary-900">
                      $97
                    </Text>
                    <Text variant="body" className="text-primary-700 ml-2">
                      /mes
                    </Text>
                  </View>
                </View>

                <Button onPress={handleUpgrade} className="mb-4">
                  Obtener membresía premium
                </Button>

                <Text variant="caption" className="text-center text-primary-600">
                  Cancela en cualquier momento
                </Text>
              </Card>
            </View>

            {/* Benefits */}
            <View className="px-6 mb-8">
              <Text variant="h4" className="mb-4">
                Beneficios de la membresía
              </Text>
              <View className="space-y-4">
                {MEMBERSHIP_BENEFITS.map((benefit, index) => (
                  <Card key={index}>
                    <View className="flex-row items-start">
                      <View className="mr-4 mt-1">{benefit.icon}</View>
                      <View className="flex-1">
                        <Text variant="body" className="font-semibold mb-1">
                          {benefit.title}
                        </Text>
                        <Text variant="caption" className="text-muted-foreground">
                          {benefit.description}
                        </Text>
                      </View>
                      <Check size={20} color="#10b981" />
                    </View>
                  </Card>
                ))}
              </View>
            </View>
          </>
        )}

        {hasMembership && (
          <>
            {/* Member Benefits */}
            <View className="px-6 mb-8">
              <Text variant="h4" className="mb-4">
                Tus beneficios activos
              </Text>
              <View className="space-y-4">
                {MEMBERSHIP_BENEFITS.map((benefit, index) => (
                  <Card key={index} className="bg-green-50 border-green-200">
                    <View className="flex-row items-start">
                      <View className="mr-4 mt-1">{benefit.icon}</View>
                      <View className="flex-1">
                        <Text variant="body" className="font-semibold mb-1 text-green-900">
                          {benefit.title}
                        </Text>
                        <Text variant="caption" className="text-green-700">
                          {benefit.description}
                        </Text>
                      </View>
                      <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                        <Check size={16} color="white" />
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            </View>

            {/* Member Actions */}
            <View className="px-6 mb-8">
              <Text variant="h4" className="mb-4">
                Acciones de miembro
              </Text>
              <View className="space-y-3">
                <Button variant="outline" onPress={() => router.push("/(tabs)/courses")}>
                  Explorar todos los cursos
                </Button>
                <Button variant="outline" onPress={() => router.push("/(tabs)/community")}>
                  Acceder a la comunidad
                </Button>
              </View>
            </View>
          </>
        )}

        {/* FAQ */}
        <View className="px-6 mb-8">
          <Text variant="h4" className="mb-4">
            Preguntas frecuentes
          </Text>
          <View className="space-y-4">
            <Card>
              <Text variant="body" className="font-semibold mb-2">
                ¿Puedo cancelar en cualquier momento?
              </Text>
              <Text variant="caption" className="text-muted-foreground">
                Sí, puedes cancelar tu membresía en cualquier momento desde tu perfil. Mantendrás el acceso hasta el
                final del período facturado.
              </Text>
            </Card>
            <Card>
              <Text variant="body" className="font-semibold mb-2">
                ¿Qué incluye la membresía?
              </Text>
              <Text variant="caption" className="text-muted-foreground">
                Acceso completo a todos los cursos, contenido exclusivo, comunidad privada y soporte prioritario.
              </Text>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeArea>
  )
}
