import { RepositorySearchService } from "./repository-search.service";
import { logger } from "../utils/logger";
import { AIProvider } from "./ai/providers/AIProvider";
import { createAIProvider } from "./ai/providers/provider.factory";

export class ExplainSelectionService {
  private searchService: RepositorySearchService;
  private aiProvider: AIProvider;

  constructor(searchService?: RepositorySearchService, aiProvider?: AIProvider) {
    this.searchService = searchService || new RepositorySearchService();
    this.aiProvider = aiProvider || createAIProvider();
  }

  /**
   * Explains a highlighted code block using the mode-specific custom prompts.
   */
  async explain(params: {
    repositoryId: string;
    filePath: string;
    startLine: number;
    endLine: number;
    selectedCode: string;
    mode: "EXPLAIN" | "SUMMARIZE" | "BUG_REVIEW" | "OPTIMIZE" | "SECURITY";
    question?: string;
  }) {
    logger.info(`ExplainSelectionService analyzing selection: file=${params.filePath}, mode=${params.mode}`);

    // 1. Fetch similarity code chunks for grounding
    let chunksText = "";
    try {
      const chunks = await this.searchService.search(params.repositoryId, params.selectedCode, 5);
      chunksText = chunks
        .map((c) => `File: ${c.filePath}\nContent:\n${c.content}`)
        .join("\n\n━━━━━━━━━━━━━━━━━━━━\n\n");
    } catch (err) {
      logger.warn(`Grounding chunks retrieval failed: ${err}. Continuing without extra context.`);
    }

    // 2. Delegate to AI Provider
    return this.aiProvider.explainCode({
      filePath: params.filePath,
      startLine: params.startLine,
      endLine: params.endLine,
      selectedCode: params.selectedCode,
      mode: params.mode,
      question: params.question,
      chunksText,
    });
  }
}
