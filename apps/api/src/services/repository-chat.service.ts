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

    // 3. Detect Mode
    const mode = this.detectMode(question);
    logger.info(`Detected Mode: ${mode}`);

    // 4. Query similar code chunks (Top 10 chunks)
    const chunks = await this.repositorySearchService.search(repositoryId, question, 10);
    logger.info(`Retrieved ${chunks.length} chunks from database`);

    // 5. Deduplicate and sort chunks
    const seen = new Set<string>();
    const uniqueChunks = chunks
      .filter((c) => {
        const key = `${c.filePath}-${c.startLine}-${c.endLine}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => b.similarity - a.similarity);

    logger.info(`Deduplicated chunks: ${uniqueChunks.length} unique chunks remaining`);

    // 6. Format context text
    let contextText = `Repository: ${repo.name}\n\n`;
    for (const chunk of uniqueChunks) {
      contextText += `File: ${chunk.filePath}\n`;
      contextText += `Line Range: ${chunk.startLine} - ${chunk.endLine}\n`;
      contextText += `Code:\n\`\`\`\n${chunk.content}\n\`\`\`\n\n`;
      contextText += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // 7. Get mode-specific system prompt
    const systemPrompt = this.getSystemPromptForMode(mode);
    const userPrompt = `${contextText}Question: ${question}`;

    logger.info(`Prompt Size: ${userPrompt.length} characters (approx. ${Math.round(userPrompt.length / 4)} tokens)`);

    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.", 500);
    }

    if (!config.openrouterChatModel) {
      throw new AppError("OPENROUTER_CHAT_MODEL is not configured.", 500);
    }

    // 8. Call OpenRouter completions
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
        temperature: 0.15, // Keep temperature low for structured evaluations
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

    // 9. Hallucination Protection verification
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

    // Map unique chunk sources
    const sources: ChatSource[] = uniqueChunks.map((chunk) => ({
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

  /**
   * Route user queries based on context matching.
   */
  private detectMode(question: string): string {
    const q = question.toLowerCase();
    if (q.includes("security") || q.includes("credential") || q.includes("secret") || q.includes("password") || q.includes("safe") || q.includes("xss") || q.includes("csrf") || q.includes("cors") || q.includes("injection")) {
      return "Security Review";
    }
    if (q.includes("performance") || q.includes("slow") || q.includes("optimize") || q.includes("leak") || q.includes("large") || q.includes("speed") || q.includes("complexity")) {
      return "Performance Review";
    }
    if (q.includes("refactor") || q.includes("solid") || q.includes("dry") || q.includes("smell") || q.includes("naming") || q.includes("convention") || q.includes("maintainability")) {
      return "Refactoring Suggestions";
    }
    if (q.includes("production ready") || q.includes("production-ready") || q.includes("deploy") || q.includes("readiness")) {
      return "Production Readiness Review";
    }
    if (q.includes("architecture") || q.includes("folder structure") || q.includes("design pattern") || q.includes("scalability")) {
      return "Architecture Review";
    }
    if (q.includes("code review") || q.includes("review code") || q.includes("review project") || q.includes("review this project") || q.includes("review this repository")) {
      return "Code Review";
    }
    if (q.includes("debug") || q.includes("error") || q.includes("bug") || q.includes("crash") || q.includes("fail") || q.includes("throw")) {
      return "Debugging Assistance";
    }
    if (q.includes("explain") || q.includes("how does") || q.includes("what is") || q.includes("where is")) {
      return "Explain";
    }
    return "General Repository Chat";
  }

  /**
   * Builds rich system prompt templates aligned with the specific routing mode.
   */
  private getSystemPromptForMode(mode: string): string {
    let modeInstructions = "";

    switch (mode) {
      case "Security Review":
        modeInstructions =
          "- Conduct a thorough security review of the retrieved codebase.\n" +
          "- Look for hardcoded credentials, secret keys, insecure validation paths, XSS risks, missing CSRF or CORS layers, or unhandled dependency checks.\n" +
          "- Mark each finding clearly as 'Observed' or 'Recommendation' under recommendations section.\n";
        break;
      case "Performance Review":
        modeInstructions =
          "- Evaluate code execution loops, heavy file metrics, repeated logical pipelines, bundle sizes, or optimization scopes.\n" +
          "- Provide concrete recommendations to optimize bundle packages or execution speeds.\n";
        break;
      case "Refactoring Suggestions":
        modeInstructions =
          "- Review structure modularity, function lengths, SOLID boundaries, naming quality, and DRY violations.\n" +
          "- Give actionable refactoring examples based on cited files.\n";
        break;
      case "Production Readiness Review":
        modeInstructions =
          "- Evaluate whether this repository is production ready.\n" +
          "- Inspect error logging coverage, config validation, database configurations, and environment checks.\n";
        break;
      case "Architecture Review":
        modeInstructions =
          "- Focus on directories mapping, system layering, clean code boundaries, modularity, and overall design patterns.\n";
        break;
      case "Code Review":
        modeInstructions =
          "- Review general code quality, design principles, style choices, and readability characteristics.\n";
        break;
      case "Debugging Assistance":
        modeInstructions =
          "- Trace the error triggers, logic issues, unhandled exceptions, and edge conditions.\n";
        break;
      case "Explain":
        modeInstructions =
          "- Provide clear, concise, step-by-step descriptions of the queried files or workflows.\n";
        break;
      default:
        modeInstructions =
          "- Answer questions with professional senior-developer evaluation standards.\n";
    }

    return (
      `You are an expert senior software engineer and AI Software Engineering Assistant.\n\n` +
      `Your detected mode is: ${mode}.\n` +
      `Mode-specific instructions:\n${modeInstructions}\n` +
      `GENERAL CONSTRAINTS & FORMATTING RULES:\n` +
      `- You MUST ground all analysis on facts in the provided repository context. Do not invent code or files.\n` +
      `- Clearly distinguish between actual repository facts and your engineering recommendations.\n` +
      `- You MUST structure your entire response using the following layout templates and dividers (do not alter section headers):\n\n` +
      `# Repository Overview\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `## Current Implementation\n` +
      `(State facts about what exists in the retrieved context. Do not speculate.)\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `## Engineering Analysis\n` +
      `(List Strengths and Weaknesses in detail based only on code patterns.)\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `## Recommendations\n` +
      `(Actionable improvement plans. Mark security issues as Observed or Recommendation.)\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `## Production Readiness Score\n` +
      `X.Y / 10\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `## Quality Metrics\n` +
      `- Architecture: X/10\n` +
      `- Maintainability: X/10\n` +
      `- Security: X/10\n` +
      `- Scalability: X/10\n` +
      `- Readability: X/10\n` +
      `- Documentation: X/10\n` +
      `- Testing: X/10\n` +
      `- Overall Score: X.Y/10\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `- If the answer cannot be found in the provided repository context, explicitly respond with:\n` +
      `"I could not find enough information inside this repository."`
    );
  }
}
