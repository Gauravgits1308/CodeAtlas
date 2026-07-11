import OpenAI from "openai";
import { config } from "../config";
import { RepositoryRepository } from "../repositories/repository.repository";
import { RepositorySearchService } from "./repository-search.service";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export interface ChatSource {
  filePath: string;
  startLine: number;
  endLine: number;
  similarity: number;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export class RepositoryChatService {
  private repositoryRepository: RepositoryRepository;
  private repositorySearchService: RepositorySearchService;
  private openai: OpenAI;

  constructor(
    repositoryRepository?: RepositoryRepository,
    repositorySearchService?: RepositorySearchService,
    openai?: OpenAI
  ) {
    this.repositoryRepository = repositoryRepository || new RepositoryRepository();
    this.repositorySearchService = repositorySearchService || new RepositorySearchService();
    this.openai =
      openai ||
      new OpenAI({
        apiKey: config.openrouterApiKey || "dummy-key",
        baseURL: config.openrouterBaseUrl,
      });
  }

  /**
   * Runs similarity retrieval and prompts OpenRouter to answer questions grounded in code context.
   *
   * @param repositoryId Target repository ID.
   * @param question The natural language question.
   */
  async chat(repositoryId: string, question: string): Promise<ChatResponse> {
    const totalStartTime = Date.now();
    logger.info(`Chat request received for repo ID: ${repositoryId}, question: "${question}"`);

    // 1. Verify repository exists
    const repo = await this.repositoryRepository.findById(repositoryId);
    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }

    // 2. Verify repository is indexed
    if (repo.status !== "COMPLETED") {
      throw new AppError("Repository codebase is not fully indexed yet.", 400);
    }

    // 3. Query similar code chunks (Top 10 chunks)
    const chunks = await this.repositorySearchService.search(repositoryId, question, 10);
    logger.info(`Retrieved ${chunks.length} chunks for chat context`);

    // 4. Construct prompt context
    let contextText = "Here is the relevant context from the repository:\n\n";
    for (const chunk of chunks) {
      contextText += `File: ${chunk.filePath}\n`;
      contextText += `Start Line: ${chunk.startLine}\n`;
      contextText += `End Line: ${chunk.endLine}\n`;
      contextText += `Code:\n\`\`\`\n${chunk.content}\n\`\`\`\n\n`;
    }

    const systemPrompt =
      "You are an expert software engineer.\n" +
      "Answer ONLY using the provided repository context.\n" +
      "Do not invent code.\n" +
      "If the answer cannot be found in the provided repository context, explicitly say so.";

    const userPrompt = `${contextText}Question: ${question}`;

    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.", 500);
    }

    if (!config.openrouterChatModel) {
      throw new AppError("OPENROUTER_CHAT_MODEL is not configured.", 500);
    }

    // 5. Call OpenRouter completions
    const llmStartTime = Date.now();
    logger.info(`Sending Chat API request to OpenRouter model: ${config.openrouterChatModel}`);

    let answer = "";
    let promptTokens = 0;
    let completionTokens = 0;

    try {
      const response = await this.openai.chat.completions.create({
        model: config.openrouterChatModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1, // Keep temperature low to prevent hallucination
      });

      answer = response.choices[0]?.message?.content || "";
      promptTokens = response.usage?.prompt_tokens || 0;
      completionTokens = response.usage?.completion_tokens || 0;

      const llmLatency = Date.now() - llmStartTime;
      logger.info(`LLM completed in ${llmLatency}ms. Prompt tokens: ${promptTokens}, Completion tokens: ${completionTokens}`);
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`OpenRouter Chat API completions failed: ${error.message}`, error);
      throw new AppError(`OpenRouter Chat completions failure: ${error.message}`, 500);
    }

    // 6. Hallucination Protection verification
    // If LLM states it can't answer or has insufficient context, normalize to our standard fallback message.
    const normalizedAnswer = answer.toLowerCase().trim();
    if (
      normalizedAnswer.includes("cannot be found") ||
      normalizedAnswer.includes("not found") ||
      normalizedAnswer.includes("insufficient context") ||
      normalizedAnswer.includes("do not have enough information") ||
      normalizedAnswer.includes("not enough information") ||
      normalizedAnswer.includes("i could not find") ||
      normalizedAnswer.includes("i don't have enough") ||
      normalizedAnswer.includes("i cannot find enough")
    ) {
      answer = "I could not find enough information inside this repository.";
    }

    const totalDuration = Date.now() - totalStartTime;
    logger.info(`Total execution completed in ${totalDuration}ms`);

    // Map source citations
    const sources: ChatSource[] = chunks.map((chunk) => ({
      filePath: chunk.filePath,
      startLine: chunk.startLine,
      endLine: chunk.endLine,
      similarity: chunk.similarity,
    }));

    return {
      answer,
      sources,
    };
  }
}
