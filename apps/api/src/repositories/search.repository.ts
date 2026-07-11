import { prisma } from "../database";

export interface SearchChunkResult {
  id: string;
  repositoryId: string;
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
  similarity: number;
}

export class SearchRepository {
  /**
   * Performs pgvector cosine similarity search over code chunks for a given repository.
   *
   * @param repositoryId Target repository ID.
   * @param embedding The query text embedding vector.
   * @param limit Top K maximum chunks count.
   */
  async searchSimilarChunks(
    repositoryId: string,
    embedding: number[],
    limit: number
  ): Promise<SearchChunkResult[]> {
    const vectorString = `[${embedding.join(",")}]`;

    const results = await prisma.$queryRaw<SearchChunkResult[]>`
      SELECT 
        c.id,
        c."repositoryId",
        c."filePath",
        c."startLine",
        c."endLine",
        c."content",
        1 - (e."embedding" <=> CAST(${vectorString} AS vector)) AS similarity
      FROM "CodeChunk" c
      JOIN "ChunkEmbedding" e ON c.id = e."chunkId"
      WHERE c."repositoryId" = ${repositoryId}
      ORDER BY similarity DESC
      LIMIT ${limit}
    `;

    return results.map((row) => ({
      id: row.id,
      repositoryId: row.repositoryId,
      filePath: row.filePath,
      startLine: row.startLine,
      endLine: row.endLine,
      content: row.content,
      similarity: Number(row.similarity || 0),
    }));
  }
}
