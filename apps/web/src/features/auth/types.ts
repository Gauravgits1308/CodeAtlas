export interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  createdAt: string
}

export interface Session {
  accessToken: string
  refreshToken: string
  user: User
  expiresAt: number
}

export interface LoginResponse {
  session: Session
}
