"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { auth } from "@clerk/nextjs/server"

/**
 * Reusable utility to securely retrieve the logged-in user's GitHub OAuth token.
 * This runs on the server side to protect secrets and avoid exposing them to the client.
 */
export async function getGithubOAuthToken(): Promise<string | null> {
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
    console.error("Error retrieving GitHub OAuth token from Clerk:", error)
    return null
  }
}
