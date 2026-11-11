"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { auth } from "@clerk/nextjs/server"

/**
 * Reusable utility to securely retrieve the logged-in user's GitHub OAuth token.
 * Includes a 3-second timeout guard to prevent Server Action hanging.
 */
export async function getGithubOAuthToken(): Promise<string | null> {
  const fetchToken = async (): Promise<string | null> => {
    try {
      const { userId } = await auth()
      if (!userId) {
        return null
      }

      const client = await clerkClient()
      const response = await client.users.getUserOauthAccessToken(
        userId,
        "oauth_github"
      )

      const oauthToken = response.data?.[0]?.token
      return oauthToken || null
    } catch (error) {
      console.error("[getGithubOAuthToken] Error retrieving GitHub OAuth token from Clerk:", error)
      return null
    }
  }

  // 3-second timeout guard
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn("[getGithubOAuthToken] Token resolution timed out after 3000ms.")
      resolve(null)
    }, 3000)
  })

  try {
    const result = await Promise.race([fetchToken(), timeoutPromise])
    clearTimeout(timeoutId!)
    return result
  } catch {
    clearTimeout(timeoutId!)
    return null
  }
}
