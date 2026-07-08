export interface UserSession {
  userId: string
  email: string
  name?: string
  imageUrl?: string
}

export interface UserProfile {
  id: string
  email: string
  name: string | null
  createdAt: Date
  updatedAt: Date
}
