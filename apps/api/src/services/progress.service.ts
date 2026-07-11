import { Prisma } from "@prisma/client";
import { prisma } from "../database";
import { sseService } from "./sse.service";
import { logger } from "../utils/logger";

export class ProgressService {
  /**
   * Retrieves the current processing status for the target repository.
   */
  async getProgress(repositoryId: string) {
    const status = await prisma.repositoryProcessingStatus.findUnique({
      where: { repositoryId },
    });

    if (!status) {
      // Return a default queued payload if no status record has been written yet
      return {
        repositoryId,
        status: "PENDING",
        currentStage: "QUEUED",
        progress: 0.0,
        message: "Repository waiting in queue...",
        errorMessage: null,
        processedFiles: 0,
        totalFiles: 0,
        processedChunks: 0,
        totalChunks: 0,
        embeddingsGenerated: 0,
        estimatedRemainingTime: null,
        startedAt: new Date(),
        finishedAt: null,
        logs: [
          {
            timestamp: new Date().toISOString(),
            message: "Repository added to processing queue.",
            stage: "QUEUED",
          },
        ],
      };
    }

    const logs = Array.isArray(status.logs) ? status.logs : [];
    let state = "PROCESSING";
    if (status.errorMessage) {
      state = "FAILED";
    } else if (status.stageProgress >= 100.0) {
      state = "COMPLETED";
    }

    return {
      repositoryId,
      status: state,
      currentStage: status.currentStage,
      progress: status.stageProgress,
      message: status.currentMessage,
      errorMessage: status.errorMessage,
      processedFiles: status.processedFiles,
      totalFiles: status.totalFiles,
      processedChunks: status.processedChunks,
      totalChunks: status.totalChunks,
      embeddingsGenerated: status.embeddingsGenerated,
      estimatedRemainingTime: status.estimatedRemainingTime,
      startedAt: status.startedAt,
      finishedAt: status.finishedAt,
      logs,
    };
  }

  /**
   * Updates progress state, appends to the log queue, and broadcasts changes to active listeners.
   */
  async updateProgress(
    repositoryId: string,
    updates: {
      currentStage?: string;
      stageProgress?: number;
      currentMessage?: string;
      errorMessage?: string;
      estimatedRemainingTime?: string;
      processedFiles?: number;
      totalFiles?: number;
      processedChunks?: number;
      totalChunks?: number;
      embeddingsGenerated?: number;
      finishedAt?: Date | null;
    }
  ) {
    logger.debug(`Updating progress for repository ${repositoryId}: Stage=${updates.currentStage}, Progress=${updates.stageProgress}`);

    // Fetch existing logs list
    const current = await prisma.repositoryProcessingStatus.findUnique({
      where: { repositoryId },
    });

    let logsList: Array<{ timestamp: string; message: string; stage: string }> = [];
    if (current && Array.isArray(current.logs)) {
      logsList = current.logs as unknown as Array<{ timestamp: string; message: string; stage: string }>;
    }

    const timestamp = new Date().toISOString();
    const stage = updates.currentStage || current?.currentStage || "QUEUED";

    // Append logs logically
    if (updates.errorMessage) {
      logsList.push({
        timestamp,
        message: `❌ Failed: ${updates.errorMessage}`,
        stage,
      });
    } else if (updates.currentMessage && (!current || current.currentMessage !== updates.currentMessage)) {
      logsList.push({
        timestamp,
        message: updates.currentMessage,
        stage,
      });
    } else if (updates.currentStage && (!current || current.currentStage !== updates.currentStage)) {
      logsList.push({
        timestamp,
        message: `Transitioned to stage: ${updates.currentStage}`,
        stage,
      });
    }

    // Upsert status record
    const result = await prisma.repositoryProcessingStatus.upsert({
      where: { repositoryId },
      create: {
        repositoryId,
        currentStage: updates.currentStage ?? "QUEUED",
        stageProgress: updates.stageProgress ?? 0.0,
        startedAt: new Date(),
        currentMessage: updates.currentMessage ?? null,
        errorMessage: updates.errorMessage ?? null,
        estimatedRemainingTime: updates.estimatedRemainingTime ?? null,
        processedFiles: updates.processedFiles ?? 0,
        totalFiles: updates.totalFiles ?? 0,
        processedChunks: updates.processedChunks ?? 0,
        totalChunks: updates.totalChunks ?? 0,
        embeddingsGenerated: updates.embeddingsGenerated ?? 0,
        logs: logsList as unknown as Prisma.InputJsonValue,
      },
      update: {
        ...updates,
        logs: logsList as unknown as Prisma.InputJsonValue,
      },
    });

    // Formulate overall status tag
    let state = "PROCESSING";
    if (result.errorMessage) {
      state = "FAILED";
    } else if (result.stageProgress >= 100.0) {
      state = "COMPLETED";
    }

    // Broadcast SSE update
    sseService.broadcast(repositoryId, {
      repositoryId,
      status: state,
      currentStage: result.currentStage,
      progress: result.stageProgress,
      message: result.currentMessage,
      errorMessage: result.errorMessage,
      processedFiles: result.processedFiles,
      totalFiles: result.totalFiles,
      processedChunks: result.processedChunks,
      totalChunks: result.totalChunks,
      embeddingsGenerated: result.embeddingsGenerated,
      estimatedRemainingTime: result.estimatedRemainingTime,
      startedAt: result.startedAt,
      finishedAt: result.finishedAt,
      logs: logsList,
    });

    return result;
  }
}

export const progressService = new ProgressService();
