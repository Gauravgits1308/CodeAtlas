import { RepositoryRepository } from "../repositories/repository.repository";
import { SearchRepository, SearchChunkResult } from "../repositories/search.repository";
import { EmbeddingService } from "./ai/embedding.service";
import { createAIProvider } from "./ai/providers/provider.factory";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class RepositorySearchService {
  private repositoryRepository: RepositoryRepository;
  private searchRepository: SearchRepository;
  private embeddingService: EmbeddingService;

  constructor(
    repositoryRepository?: RepositoryRepository,
    searchRepository?: SearchRepository,
    embeddingService?: EmbeddingService
  ) {
    this.repositoryRepository = repositoryRepository || new RepositoryRepository();
    this.searchRepository = searchRepository || new SearchRepository();
    this.embeddingService = embeddingService || new EmbeddingService(createAIProvider());
  }

  /**
   * Generates a query vector and queries similar code chunks from the target repository.
   *
   * @param repositoryId Target repository ID.
   * @param query Natural language search query.
   * @param limit Top K maximum chunks count.
   */
  async search(
    repositoryId: string,
    query: string,
    limit: number
  ): Promise<SearchChunkResult[]> {
    const startTime = Date.now();
    logger.info(`Query search received for repo ID: ${repositoryId}, query length: ${query.length}`);

    // 1. Verify repository exists
    const repo = await this.repositoryRepository.findById(repositoryId);
    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }

    // 2. Verify repository is indexed
    if (repo.status !== "COMPLETED") {
      throw new AppError("Repository codebase is not fully indexed yet.", 400);
    }

    // 3. Generate query embedding
    logger.info("Generating embedding for query");
    let embedding: number[];
    try {
      embedding = await this.embeddingService.generateEmbedding(query);
      logger.info("Query embedding generated successfully");
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Embedding generation failure: ${error.message}`, error);
      throw new AppError(`Failed to generate query embedding: ${error.message}`, 500);
    }

    // 4. Query similar database chunks
    logger.info("Similarity search started");
    const results = await this.searchRepository.searchSimilarChunks(
      repositoryId,
      embedding,
      limit
    );

    const duration = Date.now() - startTime;
    logger.info(`Similarity search completed in ${duration}ms. Found ${results.length} ranked chunks`);

    return results;
  }
}
