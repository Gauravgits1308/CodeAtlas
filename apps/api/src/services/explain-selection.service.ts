import OpenAI from "openai";
import { config } from "../config";
import { RepositorySearchService } from "./repository-search.service";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class ExplainSelectionService {
  private searchService: RepositorySearchService;
  private openai: OpenAI;

  constructor(searchService?: RepositorySearchService, openai?: OpenAI) {
    this.searchService = searchService || new RepositorySearchService();
    this.openai =
      openai ||
      new OpenAI({
        apiKey: config.openrouterApiKey || "dummy-key",
        baseURL: config.openrouterBaseUrl,
      });
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

    // 2. Select system prompt matching target mode
    let systemPrompt = "";
    switch (params.mode) {
      case "SUMMARIZE":
        systemPrompt =
          `You are an expert AI code reviewer. Your purpose is to provide a concise summary of the selected code.\n` +
          `You MUST format your analysis report using these exact Markdown headers:\n\n` +
          `## Overview\n` +
          `...\n` +
          `## Responsibilities\n` +
          `...\n` +
          `## Inputs\n` +
          `...\n` +
          `## Outputs\n` +
          `...\n` +
          `## Key Logic\n` +
          `...\n`;
        break;

      case "BUG_REVIEW":
        systemPrompt =
          `You are an expert AI code debugger. Review ONLY the selected code block for bugs, null reference risks, edge cases, infinite loops, missing validation, dead code, incorrect async handling, or potential runtime crashes.\n` +
          `You MUST format your analysis report using these exact Markdown headers:\n\n` +
          `## Critical Issues\n` +
          `...\n` +
          `## Medium Issues\n` +
          `...\n` +
          `## Low Issues\n` +
          `...\n` +
          `## Suggested Fixes\n` +
          `...\n`;
        break;

      case "OPTIMIZE":
        systemPrompt =
          `You are an expert AI performance engineer. Suggest performance and maintainability improvements. Analyze time complexity, memory usage, repeated logic, code duplication, readability, modern language features, SOLID, and DRY.\n` +
          `You MUST format your analysis report using these exact Markdown headers:\n\n` +
          `## Current Implementation\n` +
          `...\n` +
          `## Optimization Opportunities\n` +
          `...\n` +
          `## Refactored Example\n` +
          `...\n` +
          `## Estimated Benefit\n` +
          `...\n`;
        break;

      case "SECURITY":
        systemPrompt =
          `You are an expert AI security auditor. Analyze the selected code for security issues (SQL Injection, XSS, Command Injection, Unsafe File Access, Secrets leaks, Authentication Problems, Authorization Problems, Input Validation, Dependency Risks).\n` +
          `You MUST format your analysis report using these exact Markdown headers:\n\n` +
          `## Risk Level\n` +
          `...\n` +
          `## Findings\n` +
          `...\n` +
          `## Recommendations\n` +
          `...\n` +
          `## Example Fixes\n` +
          `...\n`;
        break;

      case "EXPLAIN":
      default:
        systemPrompt =
          `You are an expert AI software engineer. Explain the selected code in depth.\n` +
          `You MUST format your analysis report using these exact Markdown headers:\n\n` +
          `## 📌 Purpose\n` +
          `...\n` +
          `## ⚙️ How It Works\n` +
          `...\n` +
          `## 🔗 Dependencies\n` +
          `...\n` +
          `## 💡 Why It Exists\n` +
          `...\n` +
          `## 📖 Example Flow\n` +
          `...\n`;
    }

    const userPrompt =
      `Selected Code from File: "${params.filePath}" (lines ${params.startLine}-${params.endLine})\n` +
      `Code Snippet:\n\`\`\`\n${params.selectedCode}\n\`\`\`\n\n` +
      `Repository Context:\n${chunksText || "No context available."}\n\n` +
      (params.question ? `Follow-up query: ${params.question}` : "Analyze the selected code.");

    if (!config.openrouterApiKey) {
      throw new AppError("OPENROUTER_API_KEY is not configured.", 500);
    }

    // 3. Request OpenRouter completions
    try {
      const response = await this.openai.chat.completions.create({
        model: config.openrouterChatModel || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.15,
      });

      const explanation = response.choices[0]?.message?.content || "No analysis generated.";
      return {
        explanation,
        referencedFiles: [params.filePath],
      };
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`OpenRouter explain mode failure: ${error.message}`);
      throw new AppError(`Code analysis failed: ${error.message}`, 500);
    }
  }
}
