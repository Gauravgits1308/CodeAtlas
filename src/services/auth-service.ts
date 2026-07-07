import { api } from "@/lib/api-client"
import type { User, Session } from "@/features/auth/types"

export interface LoginCredentials {
  email: string
  password?: string
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<{ session: Session }> => {
    return api.post<{ session: Session }>("/auth/login", credentials)
  },

  getCurrentUser: async (): Promise<User> => {
    return api.get<User>("/auth/me")
  },

  logout: async (): Promise<void> => {
    return api.post<void>("/auth/logout")
  }
}
