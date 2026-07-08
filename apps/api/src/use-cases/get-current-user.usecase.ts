import { UserRepository } from "../repositories/user.repository"
import { SyncUserUseCase } from "./sync-user.usecase"
import { UserProfile } from "../types/auth.types"

export class GetCurrentUserUseCase {
  constructor(
    private userRepository: UserRepository,
    private syncUserUseCase: SyncUserUseCase
  ) {}

  async execute(userId: string): Promise<UserProfile> {
    const user = await this.userRepository.findByClerkId(userId)
    if (user) {
      return user
    }
    // Fetch and sync if the user profile is missing locally
    return this.syncUserUseCase.execute(userId)
  }
}
