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
import { t } from "../../src/lib/i18n"

const registerSchema = z
  .object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Ingresa un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  })

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterScreen() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      // TODO: Implement registration API call
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Mock delay

      setToast({ message: "¡Cuenta creada exitosamente!", type: "success" })

      setTimeout(() => {
        router.replace("/auth/login")
      }, 1500)
    } catch (error) {
      setToast({ message: "Error al crear la cuenta", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <SafeArea>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" className="px-6">
          <View className="flex-1 justify-center py-12">
            {/* Header */}
            <View className="items-center mb-12">
              <Text variant="h1" className="text-primary-600 mb-2">
                Bodhi Medicine
              </Text>
              <Text variant="caption" className="text-center">
                Crea tu cuenta
              </Text>
            </View>

            {/* Register Form */}
            <View className="space-y-6">
              <Text variant="h3" className="text-center mb-8">
                {t("auth.register")}
              </Text>

              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Nombre completo"
                    placeholder="Tu nombre"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.name?.message}
                    autoComplete="name"
                  />
                )}
              />

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
                    autoComplete="new-password"
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Confirmar contraseña"
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.confirmPassword?.message}
                    secureTextEntry
                    autoComplete="new-password"
                  />
                )}
              />

              <Button onPress={handleSubmit(onSubmit)} loading={isLoading} disabled={isLoading} className="mt-8">
                Crear cuenta
              </Button>

              <Button variant="ghost" onPress={() => router.back()} className="mt-4">
                ¿Ya tienes cuenta? Inicia sesión
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
