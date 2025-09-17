import { View, Alert } from "react-native"
import { Calendar, CreditCard, AlertCircle, CheckCircle } from "lucide-react-native"
import { Text } from "../ui/Text"
import { Button } from "../ui/Button"
import { Card } from "../ui/Card"
import { Badge } from "../ui/Badge"
import { formatDate } from "../../lib/utils"

interface Subscription {
  id: string
  status: "active" | "canceled" | "past_due" | "unpaid"
  currentPeriodEnd: Date
  plan: {
    id: string
    name: string
    amount: number
    interval: "month" | "year"
  }
}

interface SubscriptionCardProps {
  subscription: Subscription | null
  onCancel?: () => void
  onUpdate?: () => void
  loading?: boolean
}

export function SubscriptionCard({ subscription, onCancel, onUpdate, loading = false }: SubscriptionCardProps) {
  const handleCancelSubscription = () => {
    Alert.alert(
      "Cancelar suscripción",
      "¿Estás seguro de que quieres cancelar tu suscripción? Mantendrás el acceso hasta el final del período actual.",
      [
        { text: "No cancelar", style: "cancel" },
        {
          text: "Cancelar suscripción",
          style: "destructive",
          onPress: onCancel,
        },
      ],
    )
  }

  if (!subscription) {
    return (
      <Card className="bg-muted/50">
        <View className="items-center py-6">
          <AlertCircle size={32} color="#9ca3af" />
          <Text variant="body" className="font-semibold mt-3 mb-2">
            Sin suscripción activa
          </Text>
          <Text variant="caption" className="text-muted-foreground text-center mb-4">
            Suscríbete para acceder a todo el contenido premium
          </Text>
          <Button onPress={onUpdate}>Ver planes</Button>
        </View>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "success"
      case "canceled":
        return "warning"
      case "past_due":
      case "unpaid":
        return "error"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activa"
      case "canceled":
        return "Cancelada"
      case "past_due":
        return "Pago pendiente"
      case "unpaid":
        return "Sin pagar"
      default:
        return status
    }
  }

  return (
    <Card>
      <View className="space-y-4">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <View>
            <Text variant="body" className="font-semibold mb-1">
              {subscription.plan.name}
            </Text>
            <Text variant="caption" className="text-muted-foreground">
              ${subscription.plan.amount}/{subscription.plan.interval === "month" ? "mes" : "año"}
            </Text>
          </View>
          <Badge variant={getStatusColor(subscription.status)}>{getStatusText(subscription.status)}</Badge>
        </View>

        {/* Details */}
        <View className="space-y-3">
          <View className="flex-row items-center">
            <Calendar size={16} color="#6b7280" />
            <Text variant="caption" className="ml-2 text-muted-foreground">
              {subscription.status === "active" ? "Renovación:" : "Finaliza:"}{" "}
              {formatDate(subscription.currentPeriodEnd)}
            </Text>
          </View>

          <View className="flex-row items-center">
            <CreditCard size={16} color="#6b7280" />
            <Text variant="caption" className="ml-2 text-muted-foreground">
              Facturación {subscription.plan.interval === "month" ? "mensual" : "anual"}
            </Text>
          </View>

          {subscription.status === "active" && (
            <View className="flex-row items-center">
              <CheckCircle size={16} color="#10b981" />
              <Text variant="caption" className="ml-2 text-green-600">
                Acceso completo a contenido premium
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        {subscription.status === "active" && (
          <View className="flex-row space-x-3 pt-2">
            <Button variant="outline" onPress={onUpdate} disabled={loading} className="flex-1 bg-transparent">
              Cambiar plan
            </Button>
            <Button variant="destructive" onPress={handleCancelSubscription} disabled={loading} className="flex-1">
              Cancelar
            </Button>
          </View>
        )}

        {subscription.status === "canceled" && (
          <View className="pt-2">
            <Button onPress={onUpdate} disabled={loading}>
              Reactivar suscripción
            </Button>
          </View>
        )}

        {(subscription.status === "past_due" || subscription.status === "unpaid") && (
          <View className="pt-2">
            <Button onPress={onUpdate} disabled={loading}>
              Actualizar método de pago
            </Button>
          </View>
        )}
      </View>
    </Card>
  )
}
