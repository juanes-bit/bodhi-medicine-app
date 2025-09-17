import axios, { type AxiosInstance, type AxiosError } from "axios"
import * as SecureStore from "expo-secure-store"
import Constants from "expo-constants"

const API_BASE = `${Constants.expoConfig?.extra?.api}/wp-json`

class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          const token = await SecureStore.getItemAsync("auth_token")
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        } catch (error) {
          console.warn("Failed to get auth token:", error)
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          SecureStore.deleteItemAsync("auth_token").catch(() => {})
          // You might want to redirect to login here
        }
        return Promise.reject(error)
      },
    )
  }

  get instance() {
    return this.client
  }
}

export const apiClient = new ApiClient().instance
