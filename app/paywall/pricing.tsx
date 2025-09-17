"use client"

import { useState } from "react"
import { ScrollView, View } from "react-native"
import { router } from "expo-router"
import { ArrowLeft, Star } from "lucide-react-native"
import { SafeArea } from "../../src/components/layout/SafeArea"
import { Text } from "../../src/components/ui/Text"
import { Button } from "../../src/components/ui/Button"
import { PricingCard } from "../../src/components/payment/PricingCard"
import { PaymentSummary } from "../../src/components/payment/PaymentSummary"
import { useCreateCheckoutSession } from "../../src/hooks/usePayment"

const PRICING_PLANS = [
  {
    id: "monthly",
    name: "Medicina con Amor",
    price: 97,
    currency: "USD",
    interval: "month" as const,
    description: "Acceso completo mensual",
    features: [
      "Acceso a todos los cursos",
      "Contenido exclusivo premium",
      "Comunidad privada de miembros",
      "Soporte prioritario",
      "Masterclasses en vivo",
      "Recursos descargables",
    ],
    popular: false,
  },
  {
    id: "yearly",
    name: "Medicina con Amor",
    price: 970,
    currency: "USD",
    interval: "year" as const,
    description: "Acceso completo anual",
    features: [
      "Acceso a todos los cursos",
      "Contenido exclusivo premium",
      "Comunidad privada de miembros",
      "Soporte prioritario",
      "Masterclasses en vivo",
      "Recursos descargables",
      "Consultas 1:1 mensuales",
      "Certificados de finalización",
    ],
    popular: true,
    discount: 20, // 20% discount for yearly
  },
]

export default function PricingScreen() {
  const [selectedPlan, setSelectedPlan] = useState("yearly")
  const createCheckoutMutation = useCreateCheckoutSession()

  const selectedPlanData = PRICING_PLANS.find((plan) => plan.id === selectedPlan)

  const handleProceedToCheckout = async () => {
    try {
      const response = await createCheckoutMutation.mutateAsync(selectedPlan)
      // Navigate to checkout WebView
      router.push({
        pathname: "/paywall/checkout",
        params: { checkoutUrl: response.url },
      })
    } catch (error) {
      console.error("Error creating checkout session:", error)
    }
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
            Elige tu plan
          </Text>
        </View>

        {/* Hero Section */}
        <View className="px-6 py-8 text-center items-center">
          <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-4">
            <Star size={32} color="#3b82f6" />
          </View>
          <Text variant="h2" className="mb-4 text-center">
            Desbloquea tu potencial
          </Text>
          <Text variant="body" className="text-muted-foreground text-center max-w-sm">
            Accede a todo nuestro contenido premium y únete a una comunidad de aprendizaje transformadora
          </Text>
        </View>

        {/* Pricing Plans */}
        <View className="px-6 space-y-4 mb-8">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} selected={selectedPlan === plan.id} onSelect={setSelectedPlan} />
          ))}
        </View>

        {/* Payment Summary */}
        {selectedPlanData && (
          <View className="px-6 mb-8">
            <PaymentSummary
              planName={selectedPlanData.name}
              price={selectedPlanData.price}
              currency={selectedPlanData.currency}
              interval={selectedPlanData.interval}
              discount={selectedPlanData.discount}
              features={selectedPlanData.features}
            />
          </View>
        )}

        {/* CTA */}
        <View className="px-6 pb-8">
          <Button
            onPress={handleProceedToCheckout}
            loading={createCheckoutMutation.isPending}
            disabled={createCheckoutMutation.isPending}
            className="mb-4"
          >
            Continuar al pago
          </Button>

          <Text variant="caption" className="text-center text-muted-foreground">
            Pago seguro procesado por Stripe. Cancela en cualquier momento.
          </Text>
        </View>

        {/* FAQ */}
        <View className="px-6 pb-8">
          <Text variant="h4" className="mb-4">
            Preguntas frecuentes
          </Text>
          <View className="space-y-4">
            <View>
              <Text variant="body" className="font-semibold mb-2">
                ¿Puedo cambiar de plan después?
              </Text>
              <Text variant="caption" className="text-muted-foreground">
                Sí, puedes actualizar o cambiar tu plan en cualquier momento desde tu perfil.
              </Text>
            </View>
            <View>
              <Text variant="body" className="font-semibold mb-2">
                ¿Hay garantía de devolución?
              </Text>
              <Text variant="caption" className="text-muted-foreground">
                Ofrecemos una garantía de 30 días. Si no estás satisfecho, te devolvemos tu dinero.
              </Text>
            </View>
            <View>
              <Text variant="body" className="font-semibold mb-2">
                ¿Qué métodos de pago aceptan?
              </Text>
              <Text variant="caption" className="text-muted-foreground">
                Aceptamos todas las tarjetas de crédito y débito principales a través de Stripe.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeArea>
  )
}
