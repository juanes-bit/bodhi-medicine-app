import { apiClient } from "./apiClient" // Assuming apiClient is imported from another file
import type { CheckoutResponse } from "./types" // Assuming CheckoutResponse is imported from another file
const USE_MOCKS = process.env.USE_MOCKS === "true" // Assuming USE_MOCKS is a environment variable

export class BodhiAPI {
  // ... existing methods ...

  static async createCheckoutSession(planId?: string): Promise<CheckoutResponse> {
    if (USE_MOCKS) {
      // TODO: replace with real API
      return {
        url: "https://checkout.stripe.com/pay/mock-session",
      }
    }

    const response = await apiClient.post("/bodhi/v1/checkout/session", {
      planId,
      successUrl: "bodhi://checkout/success",
      cancelUrl: "bodhi://checkout/cancel",
    })
    return response.data
  }

  static async getSubscription(): Promise<any> {
    if (USE_MOCKS) {
      // TODO: replace with real API
      return {
        id: "sub_mock",
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        plan: {
          id: "yearly",
          name: "Medicina con Amor",
          amount: 970,
          interval: "year",
        },
      }
    }

    const response = await apiClient.get("/bodhi/v1/subscription")
    return response.data
  }

  static async cancelSubscription(): Promise<void> {
    if (USE_MOCKS) {
      // TODO: replace with real API
      return
    }

    await apiClient.post("/bodhi/v1/subscription/cancel")
  }

  static async updateSubscription(planId: string): Promise<any> {
    if (USE_MOCKS) {
      // TODO: replace with real API
      return {
        id: "sub_mock",
        status: "active",
        plan: { id: planId },
      }
    }

    const response = await apiClient.patch("/bodhi/v1/subscription", { planId })
    return response.data
  }
}
