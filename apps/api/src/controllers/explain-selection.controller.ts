/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { ExplainSelectionService } from "../services/explain-selection.service";
import { asyncHandler, AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class ExplainSelectionController {
  private explainService: ExplainSelectionService;

  constructor(explainService?: ExplainSelectionService) {
    this.explainService = explainService || new ExplainSelectionService();
  }

  /**
   * Endpoint handler to explain code selection block.
   */
  explainSelection = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { repositoryId, filePath, startLine, endLine, selectedCode, question, prompt, mode } = req.body;

    // Validate inputs
    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("repositoryId is required.", 400);
    }
    if (!filePath || typeof filePath !== "string" || !filePath.trim()) {
      throw new AppError("filePath is required.", 400);
    }
    if (!selectedCode || typeof selectedCode !== "string" || !selectedCode.trim()) {
      throw new AppError("selectedCode is required.", 400);
    }

    // Support both 'question' and 'prompt' keys to match frontend payload calls
    const targetQuestion = question || prompt || "";

    // Resolve and validate analysis mode
    let targetMode: "EXPLAIN" | "SUMMARIZE" | "BUG_REVIEW" | "OPTIMIZE" | "SECURITY" = "EXPLAIN";
    const requestMode = (mode || "").toString().toUpperCase();
    if (["EXPLAIN", "SUMMARIZE", "BUG_REVIEW", "OPTIMIZE", "SECURITY"].includes(requestMode)) {
      targetMode = requestMode as "EXPLAIN" | "SUMMARIZE" | "BUG_REVIEW" | "OPTIMIZE" | "SECURITY";
    }

    logger.info(`ExplainSelectionController: Repo=${repositoryId}, File=${filePath}, mode=${targetMode}`);

    const result = await this.explainService.explain({
      repositoryId: repositoryId.trim(),
      filePath: filePath.trim(),
      startLine: Number(startLine) || 1,
      endLine: Number(endLine) || 1,
      selectedCode: selectedCode.trim(),
      mode: targetMode,
      question: typeof targetQuestion === "string" ? targetQuestion.trim() : undefined,
    });

    res.status(200).json({
      success: true,
      explanation: result.explanation,
      answer: result.explanation, // Double-compatibility key matching frontend expectations
      referencedFiles: result.referencedFiles,
    });
  });
}
