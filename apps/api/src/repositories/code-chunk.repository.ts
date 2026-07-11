import { CodeChunk } from "@prisma/client";
import { prisma } from "../database";

export interface CreateChunkInput {
  repositoryId: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  classification?: string | null;
}

export class CodeChunkRepository {
  /**
   * Creates a single code chunk and returns the created record.
   */
  async create(input: CreateChunkInput): Promise<CodeChunk> {
    return prisma.codeChunk.create({
      data: input,
    });
  }

  /**
   * Bulk inserts code chunk records into the PostgreSQL database.
   */
  async createMany(chunks: CreateChunkInput[]): Promise<{ count: number }> {
    return prisma.codeChunk.createMany({
      data: chunks,
    });
  }

  /**
   * Deletes all code chunk records associated with a repository.
   */
  async deleteByRepository(repositoryId: string): Promise<{ count: number }> {
    return prisma.codeChunk.deleteMany({
      where: { repositoryId },
    });
  }
}