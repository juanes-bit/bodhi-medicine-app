"use client"

import { useState } from "react"
import { ScrollView, View, Alert, Pressable } from "react-native"
import { router } from "expo-router"
import { LogOut, Settings, Star, Edit3 } from "lucide-react-native"
import { SafeArea } from "../../../src/components/layout/SafeArea"
import { Text } from "../../../src/components/ui/Text"
import { Button } from "../../../src/components/ui/Button"
import { Card } from "../../../src/components/ui/Card"
import { Badge } from "../../../src/components/ui/Badge"
import { Avatar } from "../../../src/components/ui/Avatar"
import { SubscriptionCard } from "../../../src/components/profile/SubscriptionCard"
import { LearningStats } from "../../../src/components/profile/LearningStats"
import { RecentActivity } from "../../../src/components/profile/RecentActivity"
import { useAuthStore } from "../../../src/store/auth"
import { t } from "../../../src/lib/i18n"

// Mock data - replace with real data from API
const MOCK_STATS = {
  coursesEnrolled: 5,
  coursesCompleted: 2,
  totalWatchTime: 1240, // minutes
  currentStreak: 7,
  completionRate: 68,
}

const MOCK_ACTIVITIES = [
  {
    id: "1",
    type: "lesson_completed" as const,
    title: "Introducción a la Herbolaria",
    subtitle: "Curso: Medicina Natural Integral",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: "2",
    type: "course_enrolled" as const,
    title: "Nutrición Holística",
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    id: "3",
    type: "course_completed" as const,
    title: "Fundamentos de Medicina Natural",
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
]

const MOCK_SUBSCRIPTION = {
  id: "sub_123",
  status: "active" as const,
  currentPeriodEnd: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
  plan: {
    id: "yearly",
    name: "Medicina con Amor",
    amount: 970,
    interval: "year" as const,
  },
}

export default function ProfileScreen() {
  const { user, logout } = useAuthStore()
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  const hasMembership = user?.membership === "medicina_con_amor"

  const handleLogout = () => {
    Alert.alert("Cerrar sesión", "¿Estás seguro de que quieres cerrar sesión?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Cerrar sesión",
        style: "destructive",
        onPress: () => {
          logout()
          router.replace("/auth/login")
        },
      },
    ])
  }

  const handleEditProfile = () => {
    setIsEditingProfile(true)
    // TODO: Navigate to profile edit screen or show modal
  }

  const handleSubscriptionAction = () => {
    if (hasMembership) {
      router.push("/paywall/pricing")
    } else {
      router.push("/(tabs)/membership")
    }
  }

  return (
    <SafeArea>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-4 pb-6">
          <View className="flex-row items-center justify-between mb-6">
            <Text variant="h2">{t("nav.profile")}</Text>
            <Pressable onPress={() => router.push("/profile/settings")}>
              <Settings size={24} color="#6b7280" />
            </Pressable>
          </View>

          {/* Profile Card */}
          <Card className="overflow-hidden">
            <View className="flex-row items-center p-4">
              <Avatar src={user?.avatarUrl} fallback={user?.name?.charAt(0) || "U"} size="lg" className="mr-4" />

              <View className="flex-1">
                <Text variant="h4" className="mb-1">
                  {user?.name || "Usuario"}
                </Text>
                <Text variant="caption" className="text-muted-foreground mb-2">
                  {user?.email}
                </Text>
                <View className="flex-row items-center">
                  {hasMembership ? (
                    <Badge variant="warning" className="flex-row items-center">
                      <Star size={12} color="#f59e0b" />
                      <Text className="ml-1 text-yellow-800">Premium</Text>
                    </Badge>
                  ) : (
                    <Badge variant="outline">Básico</Badge>
                  )}
                </View>
              </View>

              <Button variant="ghost" size="icon" onPress={handleEditProfile}>
                <Edit3 size={20} color="#6b7280" />
              </Button>
            </View>
          </Card>
        </View>

        <View className="px-6 space-y-6">
          {/* Learning Stats */}
          <LearningStats stats={MOCK_STATS} />

          {/* Subscription */}
          <View>
            <Text variant="h4" className="mb-4">
              Suscripción
            </Text>
            <SubscriptionCard
              subscription={hasMembership ? MOCK_SUBSCRIPTION : null}
              onCancel={() => {
                // TODO: Implement subscription cancellation
                console.log("Cancel subscription")
              }}
              onUpdate={handleSubscriptionAction}
            />
          </View>

          {/* Recent Activity */}
          <RecentActivity
            activities={MOCK_ACTIVITIES}
            onViewAll={() => {
              // TODO: Navigate to full activity screen
              console.log("View all activities")
            }}
          />

          {/* Quick Actions */}
          <View>
            <Text variant="h4" className="mb-4">
              Acciones rápidas
            </Text>
            <Card>
              <View className="space-y-4">
                <Pressable
                  onPress={() => router.push("/(tabs)/courses")}
                  className="flex-row items-center justify-between active:opacity-70"
                >
                  <Text variant="body" className="font-medium">
                    Mis cursos
                  </Text>
                  <Text variant="caption" className="text-muted-foreground">
                    {">"}
                  </Text>
                </Pressable>

                <View className="h-px bg-border" />

                <Pressable
                  onPress={() => router.push("/(tabs)/community")}
                  className="flex-row items-center justify-between active:opacity-70"
                >
                  <Text variant="body" className="font-medium">
                    Comunidad
                  </Text>
                  <Text variant="caption" className="text-muted-foreground">
                    {">"}
                  </Text>
                </Pressable>

                <View className="h-px bg-border" />

                <Pressable
                  onPress={() => router.push("/profile/settings")}
                  className="flex-row items-center justify-between active:opacity-70"
                >
                  <Text variant="body" className="font-medium">
                    Configuración
                  </Text>
                  <Text variant="caption" className="text-muted-foreground">
                    {">"}
                  </Text>
                </Pressable>
              </View>
            </Card>
          </View>

          {/* Logout */}
          <View className="pb-8">
            <Button variant="destructive" onPress={handleLogout} className="flex-row items-center justify-center">
              <LogOut size={20} color="white" />
              <Text className="ml-2 text-white font-semibold">Cerrar sesión</Text>
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeArea>
  )
}
