import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BodhiAPI } from "../api/sdk"
import { useAuthStore } from "../store/auth"

export function useCreateCheckoutSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId?: string) => BodhiAPI.createCheckoutSession(),
    onSuccess: () => {
      // Invalidate user queries to refresh membership status after successful payment
      queryClient.invalidateQueries({ queryKey: ["me"] })
      queryClient.invalidateQueries({ queryKey: ["membership"] })
    },
  })
}

export function usePaymentSuccess() {
  const queryClient = useQueryClient()
  const { updateUser } = useAuthStore()

  return {
    handlePaymentSuccess: async () => {
      try {
        // Refresh user data to get updated membership status
        const updatedUser = await BodhiAPI.getMe()
        updateUser(updatedUser)

        // Invalidate all relevant queries
        queryClient.invalidateQueries({ queryKey: ["me"] })
        queryClient.invalidateQueries({ queryKey: ["membership"] })
        queryClient.invalidateQueries({ queryKey: ["courses"] })

        return updatedUser
      } catch (error) {
        console.error("Error refreshing user data after payment:", error)
        throw error
      }
    },
  }
}

export function useMembership() {
  const { user } = useAuthStore()

  const hasMembership = user?.membership === "medicina_con_amor"
  const membershipStatus = user?.membership || "none"

  return {
    hasMembership,
    membershipStatus,
    isPremium: hasMembership,
    canAccessPremiumContent: hasMembership,
  }
}
