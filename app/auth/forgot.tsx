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

const forgotSchema = z.object({
  email: z.string().email("Ingresa un email válido"),
})

type ForgotForm = z.infer<typeof forgotSchema>

export default function ForgotPasswordScreen() {
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: ForgotForm) => {
    setIsLoading(true)
    try {
      // TODO: Implement forgot password API call
      await new Promise((resolve) => setTimeout(resolve, 2000)) // Mock delay

      setEmailSent(true)
      setToast({ message: "Email de recuperación enviado", type: "success" })
    } catch (error) {
      setToast({ message: "Error al enviar el email", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <SafeArea>
        <View className="flex-1 justify-center px-6">
          <View className="items-center space-y-6">
            <Text variant="h2" className="text-center text-primary-600">
              Email enviado
            </Text>
            <Text variant="body" className="text-center text-muted-foreground">
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </Text>
            <Button onPress={() => router.back()} className="mt-8">
              Volver al login
            </Button>
          </View>
        </View>
      </SafeArea>
    )
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
                Recuperar contraseña
              </Text>
            </View>

            {/* Forgot Form */}
            <View className="space-y-6">
              <Text variant="h3" className="text-center mb-4">
                {t("auth.forgot_password")}
              </Text>

              <Text variant="body" className="text-center text-muted-foreground mb-8">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
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

              <Button onPress={handleSubmit(onSubmit)} loading={isLoading} disabled={isLoading} className="mt-8">
                Enviar enlace de recuperación
              </Button>

              <Button variant="ghost" onPress={() => router.back()} className="mt-4">
                Volver al login
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
