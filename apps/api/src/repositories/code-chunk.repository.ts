import { CodeChunk } from "@prisma/client";
import { prisma } from "../database";
import { sanitizeForPostgres } from "../utils/sanitize";

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
    const sanitizedInput = sanitizeForPostgres(input);
    return prisma.codeChunk.create({
      data: sanitizedInput,
    });
  }

  /**
   * Bulk inserts code chunk records into the PostgreSQL database.
   */
  async createMany(chunks: CreateChunkInput[]): Promise<{ count: number }> {
    const sanitizedChunks = sanitizeForPostgres(chunks);
    return prisma.codeChunk.createMany({
      data: sanitizedChunks,
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
