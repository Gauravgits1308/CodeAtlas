import { UserRepository } from "../repositories/user.repository"
import { AuthService } from "../services/auth.service"
import { UserProfile } from "../types/auth.types"

export class SyncUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private authService: AuthService
  ) {}

  async execute(userId: string): Promise<UserProfile> {
    const clerkUser = await this.authService.fetchClerkUser(userId)
    const user = await this.userRepository.upsertUser(
      clerkUser.userId,
      clerkUser.email,
      clerkUser.name
    )
    return user
  }
}
