import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import * as SecureStore from "expo-secure-store"
import { BodhiAPI } from "../api/sdk"
import type { User } from "../api/types"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  hydrate: () => Promise<void>
  clearError: () => void
  updateUser: (userData: Partial<User>) => void
}

type AuthStore = AuthState & AuthActions

const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name)
    } catch {
      return null
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value)
    } catch (error) {
      console.warn("Failed to save to secure store:", error)
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name)
    } catch (error) {
      console.warn("Failed to remove from secure store:", error)
    }
  },
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await BodhiAPI.login(email, password)

          // Store token securely
          await SecureStore.setItemAsync("auth_token", response.token)

          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          })
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.message || "Error al iniciar sesión",
          })
          throw error
        }
      },

      logout: async () => {
        try {
          await SecureStore.deleteItemAsync("auth_token")
        } catch (error) {
          console.warn("Failed to remove auth token:", error)
        }

        set({
          user: null,
          isAuthenticated: false,
          error: null,
        })
      },

      hydrate: async () => {
        set({ isLoading: true })

        try {
          const token = await SecureStore.getItemAsync("auth_token")

          if (!token) {
            set({ isLoading: false })
            return
          }

          // Validate token and get user data
          const isValid = await BodhiAPI.validateToken()

          if (isValid) {
            const user = await BodhiAPI.getMe()
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            // Token is invalid, clear it
            await SecureStore.deleteItemAsync("auth_token")
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            })
          }
        } catch (error) {
          console.warn("Failed to hydrate auth state:", error)
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      },

      clearError: () => set({ error: null }),

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user
        if (currentUser) {
          set({
            user: { ...currentUser, ...userData },
          })
        }
      },
    }),
    {
      name: "bodhi-auth",
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
