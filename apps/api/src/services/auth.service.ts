import { clerkClient } from "@clerk/express"
import { UserSession } from "../types/auth.types"
import { AppError } from "../utils/errors"
import { logger } from "../utils/logger"

export class AuthService {
  async fetchClerkUser(userId: string): Promise<UserSession> {
    try {
      const clerkUser = await clerkClient.users.getUser(userId)
      const email = clerkUser.emailAddresses[0]?.emailAddress
      
      if (!email) {
        throw new AppError("Authenticated user does not possess a verified email.", 400)
      }

      const name = clerkUser.firstName && clerkUser.lastName 
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName || clerkUser.lastName || undefined

      return {
        userId,
        email,
        name,
        imageUrl: clerkUser.imageUrl || undefined,
      }
    } catch (error: unknown) {
      logger.error(`Clerk User retrieval exception for ID: ${userId}`, error)
      throw new AppError("Failed to fetch authorization details from Clerk.", 500)
    }
  }
}
