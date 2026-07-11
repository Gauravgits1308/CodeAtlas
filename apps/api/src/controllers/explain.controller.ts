/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import OpenAI from "openai";
import { config } from "../config";
import { asyncHandler, AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class ExplainController {
  private openai: OpenAI;

  constructor(openai?: OpenAI) {
    this.openai =
      openai ||
      new OpenAI({
        apiKey: config.openrouterApiKey || "dummy-key",
        baseURL: config.openrouterBaseUrl,
      });
  }

  /**
   * Explains, summarizes, reviews or optimizes selected code blocks.
   */
  explainSelection = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { repositoryId, filePath, startLine, endLine, selectedCode, type, prompt } = req.body;

    // 1. Validate inputs
    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("Repository ID is required.", 400);
    }
    if (!filePath || typeof filePath !== "string" || !filePath.trim()) {
      throw new AppError("File path is required.", 400);
    }
    if (!selectedCode || typeof selectedCode !== "string" || !selectedCode.trim()) {
      throw new AppError("Selected code content is required.", 400);
    }

    const actionType = type || "Explain";
    logger.info(`Explain Selection request: Type=${actionType}, File=${filePath}, lines=${startLine}-${endLine}`);

    // 2. Build system instructions
    let actionInstruction = "";
    switch (actionType) {
      case "Summarize":
        actionInstruction = "Summarize the purpose and execution of this selected code snippet in 2-3 concise paragraphs.";
        break;
      case "Find Bugs":
        actionInstruction = "Thoroughly inspect this code snippet for logical bugs, null-pointer references, edge-condition failures, or memory leaks.";
        break;
      case "Optimize":
        actionInstruction = "Evaluate performance optimizations. Provide concrete refactoring options to improve speed, runtime, or bundle usage.";
        break;
      case "Security Review":
        actionInstruction = "Perform a security code audit on this snippet. Scan for credentials leaks, validation gaps, input validation omissions, XSS, or CORS risks.";
        break;
      default:
        actionInstruction = "Explain the logic, variables, and behavior of this selected code block clearly.";
    }

    const systemPrompt =
      `You are an expert senior software engineer and AI code reviewer.\n\n` +
      `Your task is to analyze ONLY the following selected code block from the file: "${filePath}" (Lines ${startLine || 1} to ${endLine || 1}).\n` +
      `Do not describe unrelated files or parts of the project unless explicitly context-bound.\n` +
      `Action request instructions: ${actionInstruction}\n\n` +
      `You MUST format your analysis report using these exact Markdown headers:\n` +
      `## Overview\n` +
      `...\n` +
      `## Purpose\n` +
      `...\n` +
      `## How It Works\n` +
      `...\n` +
      `## Dependencies\n` +
      `...\n` +
      `## Possible Improvements\n` +
      `...\n` +
      `## Potential Bugs\n` +
      `...\n` +
      `## Best Practices\n` +
      `...\n`;

    const userPrompt =
      `File: ${filePath}\n` +
      `Line Range: ${startLine} - ${endLine}\n` +
      `Selected Code:\n\`\`\`\n${selectedCode}\n\`\`\`\n\n` +
      (prompt ? `Follow-up Query: ${prompt}` : `Analyze the selected code snippet.`);

    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing.", 500);
    }

    // 3. Query OpenRouter Completions
    try {
      const response = await this.openai.chat.completions.create({
        model: config.openrouterChatModel || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.15,
      });

      const answer = response.choices[0]?.message?.content || "Explanation unavailable.";
      
      res.status(200).json({
        success: true,
        answer,
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`OpenRouter explain selection completions failure: ${error.message}`);
      throw new AppError(`Code explanation completions failed: ${error.message}`, 500);
    }
  });
}
