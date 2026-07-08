import { clerkClient } from "@clerk/express"
import { UserSession } from "../types/auth.types"
import { UserRepository } from "../repositories/user.repository"
import { UserProfile } from "../types/auth.types"
import { AppError } from "../utils/errors"
import { logger } from "../utils/logger"

export class AuthService {
  private userRepository: UserRepository;

  constructor(userRepository?: UserRepository) {
    this.userRepository = userRepository || new UserRepository();
  }

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
        userId: clerkUser.id,
        email,
        name,
        imageUrl: clerkUser.imageUrl || undefined,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error(`Clerk user retrieval failed for ${userId}`, error);
      throw new AppError("Failed to fetch user from Clerk.", 500);
    }
  }

  async getCurrentUser(userId: string) {
    return {
      userId,
      message: "Auth route registered successfully.",
      endpoint: "/me"
    };
  }

  async syncUser(userId: string): Promise<UserProfile> {
    const clerkUser = await this.fetchClerkUser(userId);
    const user = await this.userRepository.upsert({
      id: clerkUser.userId,
      email: clerkUser.email,
      name: clerkUser.name || null,
    });
    return user;
  }
}
