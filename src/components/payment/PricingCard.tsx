import { View, Pressable } from "react-native"
import { Check, Crown } from "lucide-react-native"
import { Text } from "../ui/Text"
import { Button } from "../ui/Button"
import { Badge } from "../ui/Badge"
import { cn } from "../../lib/utils"

interface PricingPlan {
  id: string
  name: string
  price: number
  currency: string
  interval: "month" | "year"
  description: string
  features: string[]
  popular?: boolean
  discount?: number
}

interface PricingCardProps {
  plan: PricingPlan
  onSelect: (planId: string) => void
  selected?: boolean
  className?: string
}

export function PricingCard({ plan, onSelect, selected = false, className }: PricingCardProps) {
  const discountedPrice = plan.discount ? plan.price * (1 - plan.discount / 100) : plan.price

  return (
    <Pressable
      onPress={() => onSelect(plan.id)}
      className={cn(
        "border-2 rounded-2xl p-6 active:opacity-90",
        selected ? "border-primary-500 bg-primary-50" : "border-border bg-card",
        plan.popular && "border-yellow-400 bg-yellow-50",
        className,
      )}
    >
      {/* Header */}
      <View className="items-center mb-6">
        {plan.popular && (
          <Badge variant="warning" className="mb-3 flex-row items-center">
            <Crown size={12} color="#f59e0b" />
            <Text className="ml-1 text-yellow-800">Más popular</Text>
          </Badge>
        )}

        <Text variant="h3" className="mb-2">
          {plan.name}
        </Text>

        <Text variant="caption" className="text-muted-foreground text-center mb-4">
          {plan.description}
        </Text>

        {/* Price */}
        <View className="items-center">
          {plan.discount && (
            <Text variant="body" className="text-muted-foreground line-through">
              ${plan.price}
            </Text>
          )}
          <View className="flex-row items-baseline">
            <Text variant="h2" className={selected ? "text-primary-600" : "text-foreground"}>
              ${Math.round(discountedPrice)}
            </Text>
            <Text variant="body" className="text-muted-foreground ml-1">
              /{plan.interval === "month" ? "mes" : "año"}
            </Text>
          </View>
          {plan.discount && (
            <Badge variant="success" size="sm" className="mt-2">
              Ahorra {plan.discount}%
            </Badge>
          )}
        </View>
      </View>

      {/* Features */}
      <View className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <View key={index} className="flex-row items-start">
            <View className="w-5 h-5 bg-green-100 rounded-full items-center justify-center mr-3 mt-0.5">
              <Check size={12} color="#10b981" />
            </View>
            <Text variant="body" className="flex-1 text-muted-foreground">
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {/* CTA Button */}
      <Button
        variant={selected ? "default" : "outline"}
        onPress={() => onSelect(plan.id)}
        className={cn(selected && "bg-primary-600")}
      >
        {selected ? "Seleccionado" : "Seleccionar plan"}
      </Button>
    </Pressable>
  )
}
