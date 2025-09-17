import { View } from "react-native"
import { CreditCard, Shield, Clock } from "lucide-react-native"
import { Text } from "../ui/Text"
import { Card } from "../ui/Card"
import { Badge } from "../ui/Badge"

interface PaymentSummaryProps {
  planName: string
  price: number
  currency: string
  interval: "month" | "year"
  discount?: number
  features?: string[]
}

export function PaymentSummary({ planName, price, currency, interval, discount, features }: PaymentSummaryProps) {
  const discountedPrice = discount ? price * (1 - discount / 100) : price
  const savings = discount ? price - discountedPrice : 0

  return (
    <Card className="bg-muted/50">
      <View className="space-y-4">
        {/* Plan Details */}
        <View>
          <Text variant="h4" className="mb-2">
            Resumen del pedido
          </Text>
          <View className="flex-row items-center justify-between">
            <Text variant="body" className="font-medium">
              {planName}
            </Text>
            <Badge variant="outline">{interval === "month" ? "Mensual" : "Anual"}</Badge>
          </View>
        </View>

        {/* Pricing Breakdown */}
        <View className="space-y-2">
          <View className="flex-row items-center justify-between">
            <Text variant="body" className="text-muted-foreground">
              Subtotal
            </Text>
            <Text variant="body">
              ${price} {currency}
            </Text>
          </View>

          {discount && savings > 0 && (
            <View className="flex-row items-center justify-between">
              <Text variant="body" className="text-green-600">
                Descuento ({discount}%)
              </Text>
              <Text variant="body" className="text-green-600">
                -${Math.round(savings)} {currency}
              </Text>
            </View>
          )}

          <View className="h-px bg-border" />

          <View className="flex-row items-center justify-between">
            <Text variant="body" className="font-semibold">
              Total
            </Text>
            <Text variant="h4" className="text-primary-600">
              ${Math.round(discountedPrice)} {currency}
            </Text>
          </View>
        </View>

        {/* Payment Security */}
        <View className="border-t border-border pt-4">
          <View className="flex-row items-center space-x-4">
            <View className="flex-row items-center">
              <Shield size={16} color="#10b981" />
              <Text variant="small" className="ml-1 text-green-600">
                Pago seguro
              </Text>
            </View>
            <View className="flex-row items-center">
              <CreditCard size={16} color="#6b7280" />
              <Text variant="small" className="ml-1 text-muted-foreground">
                Stripe
              </Text>
            </View>
            <View className="flex-row items-center">
              <Clock size={16} color="#6b7280" />
              <Text variant="small" className="ml-1 text-muted-foreground">
                Cancela cuando quieras
              </Text>
            </View>
          </View>
        </View>

        {/* Key Features */}
        {features && features.length > 0 && (
          <View className="border-t border-border pt-4">
            <Text variant="body" className="font-medium mb-2">
              Incluye:
            </Text>
            <View className="space-y-1">
              {features.slice(0, 3).map((feature, index) => (
                <Text key={index} variant="small" className="text-muted-foreground">
                  • {feature}
                </Text>
              ))}
              {features.length > 3 && (
                <Text variant="small" className="text-primary-600">
                  +{features.length - 3} beneficios más
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
    </Card>
  )
}
