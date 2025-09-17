"use client"

import { ScrollView, View, Linking } from "react-native"
import { ExternalLink, MessageCircle, Users, BookOpen, Calendar, Globe } from "lucide-react-native"
import { SafeArea } from "../../../src/components/layout/SafeArea"
import { Text } from "../../../src/components/ui/Text"
import { Card } from "../../../src/components/ui/Card"
import { Button } from "../../../src/components/ui/Button"
import { useAuthStore } from "../../../src/store/auth"
import { t } from "../../../src/lib/i18n"

const COMMUNITY_LINKS = [
  {
    title: "Grupo de WhatsApp",
    description: "Únete a nuestra comunidad activa",
    icon: <MessageCircle size={24} color="#25d366" />,
    url: "https://chat.whatsapp.com/example",
    requiresMembership: true,
  },
  {
    title: "Canal de Telegram",
    description: "Recibe actualizaciones y contenido exclusivo",
    icon: <MessageCircle size={24} color="#0088cc" />,
    url: "https://t.me/bodhimedicine",
    requiresMembership: false,
  },
  {
    title: "Sitio web oficial",
    description: "Visita nuestro sitio principal",
    icon: <Globe size={24} color="#3b82f6" />,
    url: "https://bodhimedicine.com",
    requiresMembership: false,
  },
  {
    title: "Blog de recursos",
    description: "Artículos y guías complementarias",
    icon: <BookOpen size={24} color="#8b5cf6" />,
    url: "https://bodhimedicine.com/blog",
    requiresMembership: false,
  },
]

const UPCOMING_EVENTS = [
  {
    title: "Masterclass: Herbolaria Básica",
    date: "15 de Enero, 2025",
    time: "7:00 PM GMT-5",
    description: "Aprende los fundamentos de la medicina herbal",
    requiresMembership: true,
  },
  {
    title: "Q&A Mensual",
    date: "22 de Enero, 2025",
    time: "6:00 PM GMT-5",
    description: "Sesión de preguntas y respuestas con expertos",
    requiresMembership: false,
  },
]

export default function CommunityScreen() {
  const { user } = useAuthStore()
  const hasMembership = user?.membership === "medicina_con_amor"

  const handleLinkPress = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      }
    } catch (error) {
      console.error("Error opening link:", error)
    }
  }

  return (
    <SafeArea>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <Text variant="h2" className="mb-2">
            {t("nav.community")}
          </Text>
          <Text variant="body" className="text-muted-foreground">
            Conecta con otros estudiantes y expertos
          </Text>
        </View>

        {/* Community Stats */}
        <View className="px-6 mb-8">
          <Card className="bg-primary-50 border-primary-200">
            <View className="flex-row items-center justify-around">
              <View className="items-center">
                <View className="w-12 h-12 bg-primary-600 rounded-full items-center justify-center mb-2">
                  <Users size={24} color="white" />
                </View>
                <Text variant="body" className="font-semibold text-primary-900">
                  2,500+
                </Text>
                <Text variant="caption" className="text-primary-700">
                  Miembros
                </Text>
              </View>
              <View className="items-center">
                <View className="w-12 h-12 bg-secondary-600 rounded-full items-center justify-center mb-2">
                  <MessageCircle size={24} color="white" />
                </View>
                <Text variant="body" className="font-semibold text-secondary-900">
                  150+
                </Text>
                <Text variant="caption" className="text-secondary-700">
                  Conversaciones diarias
                </Text>
              </View>
              <View className="items-center">
                <View className="w-12 h-12 bg-green-600 rounded-full items-center justify-center mb-2">
                  <BookOpen size={24} color="white" />
                </View>
                <Text variant="body" className="font-semibold text-green-900">
                  50+
                </Text>
                <Text variant="caption" className="text-green-700">
                  Recursos compartidos
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Community Links */}
        <View className="px-6 mb-8">
          <Text variant="h4" className="mb-4">
            Únete a la comunidad
          </Text>
          <View className="space-y-4">
            {COMMUNITY_LINKS.map((link, index) => (
              <Card
                key={index}
                pressable={!link.requiresMembership || hasMembership}
                onPress={() => {
                  if (!link.requiresMembership || hasMembership) {
                    handleLinkPress(link.url)
                  }
                }}
                className={link.requiresMembership && !hasMembership ? "opacity-60" : ""}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="mr-4">{link.icon}</View>
                    <View className="flex-1">
                      <Text variant="body" className="font-semibold mb-1">
                        {link.title}
                        {link.requiresMembership && !hasMembership && " (Premium)"}
                      </Text>
                      <Text variant="caption" className="text-muted-foreground">
                        {link.description}
                      </Text>
                    </View>
                  </View>
                  {(!link.requiresMembership || hasMembership) && <ExternalLink size={20} color="#9ca3af" />}
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Upcoming Events */}
        <View className="px-6 mb-8">
          <Text variant="h4" className="mb-4">
            Próximos eventos
          </Text>
          <View className="space-y-4">
            {UPCOMING_EVENTS.map((event, index) => (
              <Card key={index} className={event.requiresMembership && !hasMembership ? "opacity-60" : ""}>
                <View className="flex-row items-start">
                  <View className="w-12 h-12 bg-muted rounded-full items-center justify-center mr-4">
                    <Calendar size={20} color="#6b7280" />
                  </View>
                  <View className="flex-1">
                    <Text variant="body" className="font-semibold mb-1">
                      {event.title}
                      {event.requiresMembership && !hasMembership && " (Premium)"}
                    </Text>
                    <Text variant="caption" className="text-muted-foreground mb-2">
                      {event.description}
                    </Text>
                    <View className="flex-row items-center space-x-4">
                      <Text variant="small" className="text-primary-600">
                        {event.date}
                      </Text>
                      <Text variant="small" className="text-muted-foreground">
                        {event.time}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </View>

        {/* Community Guidelines */}
        <View className="px-6 mb-8">
          <Text variant="h4" className="mb-4">
            Normas de la comunidad
          </Text>
          <Card>
            <View className="space-y-3">
              <Text variant="body" className="font-semibold">
                Mantengamos un ambiente respetuoso y constructivo
              </Text>
              <View className="space-y-2">
                <Text variant="caption" className="text-muted-foreground">
                  • Respeta a todos los miembros y sus opiniones
                </Text>
                <Text variant="caption" className="text-muted-foreground">
                  • Comparte conocimiento y experiencias relevantes
                </Text>
                <Text variant="caption" className="text-muted-foreground">
                  • No hagas spam ni promociones no autorizadas
                </Text>
                <Text variant="caption" className="text-muted-foreground">
                  • Mantén las conversaciones relacionadas con medicina natural
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {!hasMembership && (
          <View className="px-6 mb-8">
            <Card className="bg-yellow-50 border-yellow-200">
              <View className="text-center items-center">
                <Text variant="body" className="font-semibold text-yellow-900 mb-2">
                  ¿Quieres acceso completo?
                </Text>
                <Text variant="caption" className="text-yellow-700 mb-4 text-center">
                  Únete a la membresía premium para acceder a grupos exclusivos y eventos especiales
                </Text>
                <Button onPress={() => handleLinkPress("/membership")}>Ver membresía premium</Button>
              </View>
            </Card>
          </View>
        )}
      </ScrollView>
    </SafeArea>
  )
}
