import { prisma } from "../database";
import { Repository } from "@prisma/client";

export type CreateRepositoryInput = {
  githubRepoId: string;
  name: string;
  fullName: string;
  owner: string;
  visibility: string;
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
  description?: string | null;
  primaryLanguage?: string | null;
  stars?: number;
  forks?: number;
  watchers?: number;
  userId: string;
};

export class RepositoryRepository {
  async create(data: CreateRepositoryInput): Promise<Repository> {
    return prisma.repository.create({
      data,
    });
  }

  async createMany(data: CreateRepositoryInput[]): Promise<{ count: number }> {
    return prisma.repository.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async findByOwnerAndName(owner: string, name: string, userId: string): Promise<Repository | null> {
    return prisma.repository.findUnique({
      where: {
        owner_name_userId: {
          owner,
          name,
          userId,
        },
      },
    });
  }

  async findByUser(userId: string): Promise<Repository[]> {
    return prisma.repository.findMany({
      where: { userId },
    });
  }

  async upsert(data: CreateRepositoryInput): Promise<Repository> {
    const { owner, name, userId, ...rest } = data;
    return prisma.repository.upsert({
      where: {
        owner_name_userId: {
          owner,
          name,
          userId,
        },
      },
      update: {
        ...rest,
      },
      create: {
        owner,
        name,
        userId,
        ...rest,
      },
    });
  }
}
