import { prisma } from "../database";
import { UserProfile } from "../types/auth.types";

export class UserRepository {
  async findByClerkId(clerkId: string): Promise<UserProfile | null> {
    return prisma.user.findUnique({
      where: { id: clerkId },
    });
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: { id: string; email: string; name?: string | null }): Promise<UserProfile> {
    return prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        name: data.name ?? null,
      },
    });
  }

  async update(clerkId: string, data: { email?: string; name?: string | null }): Promise<UserProfile> {
    return prisma.user.update({
      where: { id: clerkId },
      data: {
        email: data.email,
        name: data.name,
      },
    });
  }

  async upsert(data: { id: string; email: string; name?: string | null }): Promise<UserProfile> {
    return prisma.user.upsert({
      where: { id: data.id },
      update: {
        email: data.email,
        name: data.name ?? null,
      },
      create: {
        id: data.id,
        email: data.email,
        name: data.name ?? null,
      },
    });
  }
}
