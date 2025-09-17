"use client"

import { useState } from "react"
import { ScrollView, View, Alert } from "react-native"
import { router } from "expo-router"
import {
  ArrowLeft,
  Bell,
  Download,
  Shield,
  Trash2,
  HelpCircle,
  FileText,
  Globe,
  Moon,
  Smartphone,
} from "lucide-react-native"
import { SafeArea } from "../../src/components/layout/SafeArea"
import { Text } from "../../src/components/ui/Text"
import { Button } from "../../src/components/ui/Button"
import { Card } from "../../src/components/ui/Card"
import { Switch } from "../../src/components/ui/Switch"
import { Select } from "../../src/components/ui/Select"
import { useUIStore } from "../../src/store/ui"
import { useAuthStore } from "../../src/store/auth"
import { setLocale } from "../../src/lib/i18n"

const LANGUAGE_OPTIONS = [
  { label: "Español", value: "es" },
  { label: "English", value: "en" },
]

const THEME_OPTIONS = [
  { label: "Sistema", value: "system" },
  { label: "Claro", value: "light" },
  { label: "Oscuro", value: "dark" },
]

export default function SettingsScreen() {
  const { locale, theme, setLocale: setUILocale, setTheme } = useUIStore()
  const { logout } = useAuthStore()

  const [notifications, setNotifications] = useState({
    newCourses: true,
    lessonReminders: true,
    communityUpdates: false,
    marketing: false,
  })

  const [downloads, setDownloads] = useState({
    autoDownload: false,
    wifiOnly: true,
    videoQuality: "medium",
  })

  const handleLanguageChange = (newLocale: string) => {
    setUILocale(newLocale)
    setLocale(newLocale)
  }

  const handleDeleteAccount = () => {
    Alert.alert("Eliminar cuenta", "Esta acción no se puede deshacer. Se eliminarán todos tus datos y progreso.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar cuenta",
        style: "destructive",
        onPress: () => {
          // TODO: Implement account deletion
          console.log("Delete account")
        },
      },
    ])
  }

  const handleClearCache = () => {
    Alert.alert("Limpiar caché", "¿Quieres limpiar todos los datos almacenados en caché?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Limpiar",
        onPress: () => {
          // TODO: Implement cache clearing
          console.log("Clear cache")
        },
      },
    ])
  }

  return (
    <SafeArea>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center px-6 py-4 border-b border-border">
          <Button variant="ghost" size="icon" onPress={() => router.back()}>
            <ArrowLeft size={20} color="#374151" />
          </Button>
          <Text variant="h3" className="ml-4">
            Configuración
          </Text>
        </View>

        <View className="px-6 py-6 space-y-6">
          {/* App Settings */}
          <View>
            <Text variant="h4" className="mb-4">
              Aplicación
            </Text>
            <Card>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Globe size={20} color="#6b7280" />
                    <Text variant="body" className="ml-3 font-medium">
                      Idioma
                    </Text>
                  </View>
                  <View className="w-32">
                    <Select
                      value={locale}
                      onValueChange={handleLanguageChange}
                      options={LANGUAGE_OPTIONS}
                      placeholder="Seleccionar"
                    />
                  </View>
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Moon size={20} color="#6b7280" />
                    <Text variant="body" className="ml-3 font-medium">
                      Tema
                    </Text>
                  </View>
                  <View className="w-32">
                    <Select value={theme} onValueChange={setTheme} options={THEME_OPTIONS} placeholder="Seleccionar" />
                  </View>
                </View>
              </View>
            </Card>
          </View>

          {/* Notifications */}
          <View>
            <Text variant="h4" className="mb-4">
              Notificaciones
            </Text>
            <Card>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Bell size={20} color="#6b7280" />
                    <View className="ml-3">
                      <Text variant="body" className="font-medium">
                        Nuevos cursos
                      </Text>
                      <Text variant="caption" className="text-muted-foreground">
                        Notificaciones de contenido nuevo
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notifications.newCourses}
                    onValueChange={(value) => setNotifications({ ...notifications, newCourses: value })}
                  />
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Bell size={20} color="#6b7280" />
                    <View className="ml-3">
                      <Text variant="body" className="font-medium">
                        Recordatorios de lecciones
                      </Text>
                      <Text variant="caption" className="text-muted-foreground">
                        Recordatorios para continuar aprendiendo
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notifications.lessonReminders}
                    onValueChange={(value) => setNotifications({ ...notifications, lessonReminders: value })}
                  />
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Bell size={20} color="#6b7280" />
                    <View className="ml-3">
                      <Text variant="body" className="font-medium">
                        Actualizaciones de comunidad
                      </Text>
                      <Text variant="caption" className="text-muted-foreground">
                        Eventos y actividades de la comunidad
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={notifications.communityUpdates}
                    onValueChange={(value) => setNotifications({ ...notifications, communityUpdates: value })}
                  />
                </View>
              </View>
            </Card>
          </View>

          {/* Downloads */}
          <View>
            <Text variant="h4" className="mb-4">
              Descargas
            </Text>
            <Card>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Download size={20} color="#6b7280" />
                    <View className="ml-3">
                      <Text variant="body" className="font-medium">
                        Solo con WiFi
                      </Text>
                      <Text variant="caption" className="text-muted-foreground">
                        Descargar contenido solo con WiFi
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={downloads.wifiOnly}
                    onValueChange={(value) => setDownloads({ ...downloads, wifiOnly: value })}
                  />
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <Smartphone size={20} color="#6b7280" />
                    <Text variant="body" className="ml-3 font-medium">
                      Calidad de video
                    </Text>
                  </View>
                  <View className="w-32">
                    <Select
                      value={downloads.videoQuality}
                      onValueChange={(value) => setDownloads({ ...downloads, videoQuality: value })}
                      options={[
                        { label: "Baja", value: "low" },
                        { label: "Media", value: "medium" },
                        { label: "Alta", value: "high" },
                      ]}
                      placeholder="Seleccionar"
                    />
                  </View>
                </View>
              </View>
            </Card>
          </View>

          {/* Privacy & Security */}
          <View>
            <Text variant="h4" className="mb-4">
              Privacidad y seguridad
            </Text>
            <Card>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Shield size={20} color="#6b7280" />
                    <Text variant="body" className="ml-3 font-medium">
                      Cambiar contraseña
                    </Text>
                  </View>
                  <Text variant="caption" className="text-primary-600">
                    Cambiar
                  </Text>
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <FileText size={20} color="#6b7280" />
                    <Text variant="body" className="ml-3 font-medium">
                      Descargar mis datos
                    </Text>
                  </View>
                  <Text variant="caption" className="text-primary-600">
                    Solicitar
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Support */}
          <View>
            <Text variant="h4" className="mb-4">
              Soporte
            </Text>
            <Card>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <HelpCircle size={20} color="#6b7280" />
                    <Text variant="body" className="ml-3 font-medium">
                      Centro de ayuda
                    </Text>
                  </View>
                  <Text variant="caption" className="text-primary-600">
                    Abrir
                  </Text>
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <FileText size={20} color="#6b7280" />
                    <Text variant="body" className="ml-3 font-medium">
                      Términos de servicio
                    </Text>
                  </View>
                  <Text variant="caption" className="text-primary-600">
                    Ver
                  </Text>
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <FileText size={20} color="#6b7280" />
                    <Text variant="body" className="ml-3 font-medium">
                      Política de privacidad
                    </Text>
                  </View>
                  <Text variant="caption" className="text-primary-600">
                    Ver
                  </Text>
                </View>
              </View>
            </Card>
          </View>

          {/* Storage */}
          <View>
            <Text variant="h4" className="mb-4">
              Almacenamiento
            </Text>
            <Card>
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text variant="body" className="font-medium mb-1">
                      Caché de la aplicación
                    </Text>
                    <Text variant="caption" className="text-muted-foreground">
                      45.2 MB utilizados
                    </Text>
                  </View>
                  <Button variant="outline" size="sm" onPress={handleClearCache}>
                    Limpiar
                  </Button>
                </View>

                <View className="h-px bg-border" />

                <View className="flex-row items-center justify-between">
                  <View>
                    <Text variant="body" className="font-medium mb-1">
                      Contenido descargado
                    </Text>
                    <Text variant="caption" className="text-muted-foreground">
                      1.2 GB utilizados
                    </Text>
                  </View>
                  <Button variant="outline" size="sm">
                    Gestionar
                  </Button>
                </View>
              </View>
            </Card>
          </View>

          {/* Danger Zone */}
          <View>
            <Text variant="h4" className="mb-4 text-red-600">
              Zona de peligro
            </Text>
            <Card className="border-red-200">
              <View className="space-y-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Trash2 size={20} color="#ef4444" />
                    <View className="ml-3">
                      <Text variant="body" className="font-medium text-red-600">
                        Eliminar cuenta
                      </Text>
                      <Text variant="caption" className="text-red-500">
                        Esta acción no se puede deshacer
                      </Text>
                    </View>
                  </View>
                  <Button variant="destructive" size="sm" onPress={handleDeleteAccount}>
                    Eliminar
                  </Button>
                </View>
              </View>
            </Card>
          </View>
        </View>
      </ScrollView>
    </SafeArea>
  )
}
