import { prisma } from "../database"
import { UserProfile } from "../types/auth.types"

export class UserRepository {
  async findById(id: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    })
    return user
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    return user
  }

  async upsertUser(id: string, email: string, name?: string): Promise<UserProfile> {
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        name,
      },
      create: {
        id,
        email,
        name,
      },
    })
    return user
  }

  async deleteUser(id: string): Promise<UserProfile> {
    const user = await prisma.user.delete({
      where: { id },
    })
    return user
  }
}
