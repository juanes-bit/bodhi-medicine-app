"use client"

import { useState } from "react"
import { View, ScrollView, KeyboardAvoidingView, Platform } from "react-native"
import { router } from "expo-router"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { SafeArea } from "../../src/components/layout/SafeArea"
import { Text } from "../../src/components/ui/Text"
import { Input } from "../../src/components/ui/Input"
import { Button } from "../../src/components/ui/Button"
import { Toast } from "../../src/components/feedback/Toast"
import { useAuthStore } from "../../src/store/auth"
import { t } from "../../src/lib/i18n"

const loginSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginScreen() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const { login, isLoading, error, clearError } = useAuthStore()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginForm) => {
    try {
      clearError()
      await login(data.email, data.password)
      setToast({ message: "¡Bienvenido!", type: "success" })

      // Navigate to main app after successful login
      setTimeout(() => {
        router.replace("/(tabs)")
      }, 1000)
    } catch (error) {
      setToast({ message: "Error al iniciar sesión", type: "error" })
    }
  }

  return (
    <SafeArea>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" className="px-6">
          <View className="flex-1 justify-center py-12">
            {/* Logo/Header */}
            <View className="items-center mb-12">
              <Text variant="h1" className="text-primary-600 mb-2">
                Bodhi Medicine
              </Text>
              <Text variant="caption" className="text-center">
                Tu cuerpo sabe
              </Text>
            </View>

            {/* Login Form */}
            <View className="space-y-6">
              <Text variant="h3" className="text-center mb-8">
                {t("auth.login")}
              </Text>

              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t("auth.email")}
                    placeholder="tu@email.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.email?.message}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label={t("auth.password")}
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                    secureTextEntry
                    autoComplete="password"
                  />
                )}
              />

              {error && <Text className="text-red-500 text-center text-sm">{error}</Text>}

              <Button onPress={handleSubmit(onSubmit)} loading={isLoading} disabled={isLoading} className="mt-8">
                {t("auth.login")}
              </Button>

              <Button variant="ghost" onPress={() => router.push("/auth/forgot")} className="mt-4">
                {t("auth.forgot_password")}
              </Button>

              <Button variant="outline" onPress={() => router.push("/auth/register")} className="mt-2">
                {t("auth.register")}
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Toast
        visible={!!toast}
        message={toast?.message || ""}
        type={toast?.type || "info"}
        onHide={() => setToast(null)}
      />
    </SafeArea>
  )
}
