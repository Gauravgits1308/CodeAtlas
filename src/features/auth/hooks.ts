"use client"

import * as React from "react"
import type { User, Session } from "./types"

export function useAuth() {
  const [user, setUser] = React.useState<User | null>(null)
  const [session, setSession] = React.useState<Session | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // Session resolution logic placeholder
    const resolveSession = async () => {
      setIsLoading(false)
    }
    resolveSession()
  }, [])

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    setUser,
    setSession,
  }
}
