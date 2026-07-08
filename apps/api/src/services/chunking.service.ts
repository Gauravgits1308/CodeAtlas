import { CreateChunkInput } from "../repositories/code-chunk.repository";

export class ChunkingService {
  /**
   * Partitions source file text content into sliding windows of line ranges with overlaps.
   */
  chunkFile(
    repositoryId: string,
    filePath: string,
    content: string,
    maxLines: number = 300,
    overlap: number = 50
  ): CreateChunkInput[] {
    const lines = content.split(/\r?\n/);
    const chunks: CreateChunkInput[] = [];

    if (lines.length === 0 || (lines.length === 1 && lines[0] === "")) {
      return [];
    }

    let startIdx = 0;
    while (startIdx < lines.length) {
      const endIdx = Math.min(startIdx + maxLines, lines.length);
      const chunkLines = lines.slice(startIdx, endIdx);

      chunks.push({
        repositoryId,
        filePath,
        startLine: startIdx + 1,
        endLine: endIdx,
        content: chunkLines.join("\n"),
      });

      if (endIdx === lines.length) {
        break;
      }

      startIdx += (maxLines - overlap);

      // Prevent infinite loops if overlap is misconfigured to equal or exceed maxLines
      if (maxLines <= overlap) {
        break;
      }
    }

    return chunks;
  }
}
