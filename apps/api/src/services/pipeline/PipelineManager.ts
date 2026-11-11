import { prisma } from "../../database";
import { logger } from "../../utils/logger";
import { progressService } from "../progress.service";
import { PipelineContext, PipelineTask } from "./Task";
import { CloneTask } from "./tasks/CloneTask";
import { ExtractTask } from "./tasks/ExtractTask";
import { ChunkTask } from "./tasks/ChunkTask";
import { EmbeddingTask } from "./tasks/EmbeddingTask";
import { MetricTask } from "./tasks/MetricTask";
import { HealthTask } from "./tasks/HealthTask";
import * as fs from "fs";
import * as path from "path";
import { AppError } from "../../utils/errors";

export class PipelineManager {
  private repositoryId: string;
  private userId: string;
  private ctx: PipelineContext;
  private tasks: PipelineTask[];
  private heartbeatInterval: ReturnType<typeof setTimeout> | null = null;
  private readonly TASK_TIMEOUT_MS = 300000; // 5 minutes max timeout per task stage

  constructor(repositoryId: string, userId: string) {
    this.repositoryId = repositoryId;
    this.userId = userId;
    this.ctx = {
      repositoryId,
      userId,
      completedStages: [],
      failedStage: null,
      failureReason: null,
      duration: 0,
      processedFiles: 0,
      totalFiles: 0,
      processedChunks: 0,
      totalChunks: 0,
      embeddingsGenerated: 0,
      startedAt: new Date(),
    };

    this.tasks = [
      new CloneTask(),
      new ExtractTask(),
      new ChunkTask(),
      new EmbeddingTask(),
      new MetricTask(),
      new HealthTask(),
    ];
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await prisma.repositoryProcessingStatus.update({
          where: { repositoryId: this.repositoryId },
          data: { lastHeartbeat: new Date() },
        });
      } catch (err) {
        logger.warn(`Failed to update heartbeat for repository ${this.repositoryId}: ${err}`);
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  async run(): Promise<void> {
    this.startHeartbeat();
    const startTime = Date.now();

    logger.info(`[PipelineManager] Starting repository import pipeline for ID: ${this.repositoryId}`);

    const summary = {
      Clone: "not started",
      Extract: "not started",
      Chunk: "not started",
      Embedding: "not started",
      Metrics: "not started",
      Health: "not started",
    };

    const printSummary = () => {
      const totalTime = Date.now() - startTime;
      logger.info(`
=========================================
Pipeline Summary
Repository: ${this.repositoryId}
Clone: ${summary.Clone}
Extract: ${summary.Extract}
Chunk: ${summary.Chunk}
Embedding: ${summary.Embedding}
Metrics: ${summary.Metrics}
Health: ${summary.Health}
Total Time: ${totalTime} ms
=========================================
      `);
    };

    // Reset database state to QUEUED
    await prisma.repository.update({
      where: { id: this.repositoryId },
      data: { status: "QUEUED" },
    });
    logger.info(`[PipelineManager] [Repository: ${this.repositoryId}] Status transitioned to: QUEUED`);

    await progressService.updateProgress(this.repositoryId, {
      currentStage: "QUEUED",
      stageProgress: 0.0,
      currentMessage: "Starting task execution pipeline...",
      finishedAt: null,
    });

    try {
      for (const task of this.tasks) {
        // Check for active cancellation before starting task
        const currentRepo = await prisma.repository.findUnique({
          where: { id: this.repositoryId },
          select: { status: true },
        });

        if (currentRepo?.status === "CANCELLED" || currentRepo?.status === "STALLED") {
          logger.info(`[PipelineManager] Pipeline execution aborted for repository ${this.repositoryId} due to status: ${currentRepo.status}`);
          return;
        }

        const taskStartTime = Date.now();

        let displayStage = task.name;
        let progressPercent = 0.0;
        let displayMessage = "";

        if (task.name === "CLONING") {
          displayStage = "Cloning Repository";
          progressPercent = 15.0;
          displayMessage = "Cloning repository files from GitHub...";
        } else if (task.name === "EXTRACTING") {
          displayStage = "Extracting Files";
          progressPercent = 35.0;
          displayMessage = "Extracting supported source files from repository...";
        } else if (task.name === "CHUNKING") {
          displayStage = "Chunking Code";
          progressPercent = 50.0;
          displayMessage = "Chunking codebase files into semantic windows...";
        } else if (task.name === "GENERATING_EMBEDDINGS") {
          displayStage = "Generating Embeddings";
          progressPercent = 75.0;
          displayMessage = "Generating vector embeddings for code chunks...";
        } else if (task.name === "CALCULATING_METRICS") {
          displayStage = "Calculating Repository Metrics";
          progressPercent = 85.0;
          displayMessage = "Calculating lines of code and directory metrics...";
        } else if (task.name === "AI_HEALTH_ANALYSIS") {
          displayStage = "AI Health Analysis";
          progressPercent = 95.0;
          displayMessage = "Evaluating repository structure against LLM metrics...";
        }

        // Set DB status
        let dbStatus: any = "PROCESSING";
        if (task.name === "CLONING") {
          dbStatus = "CLONING";
        } else if (
          task.name === "CALCULATING_METRICS" ||
          task.name === "AI_HEALTH_ANALYSIS"
        ) {
          dbStatus = "ANALYZING";
        }

        await prisma.repository.update({
          where: { id: this.repositoryId },
          data: { status: dbStatus },
        });

        await progressService.updateProgress(this.repositoryId, {
          currentStage: displayStage,
          stageProgress: progressPercent,
          currentMessage: displayMessage,
        });

        // DB Commit Verification Log
        const committedRepo = await prisma.repository.findUnique({ where: { id: this.repositoryId }, select: { status: true } });
        const committedProgress = await prisma.repositoryProcessingStatus.findUnique({ where: { repositoryId: this.repositoryId }, select: { stageProgress: true, currentStage: true } });
        logger.info(`[PipelineManager] [DB_VERIFIED] Task=${task.name} Status=${committedRepo?.status} Stage=${committedProgress?.currentStage} Progress=${committedProgress?.stageProgress}%`);

        let stageLabel = displayStage;
        let failedAtString = task.name;
        if (task.name === "CLONING") {
          failedAtString = "CLONE_REPOSITORY";
        } else if (task.name === "EXTRACTING") {
          failedAtString = "FILE_EXTRACTION";
        } else if (task.name === "CHUNKING") {
          failedAtString = "FILE_CHUNKING";
        } else if (task.name === "GENERATING_EMBEDDINGS") {
          failedAtString = "GENERATING_EMBEDDINGS";
        } else if (task.name === "CALCULATING_METRICS") {
          failedAtString = "CALCULATING_METRICS";
        } else if (task.name === "AI_HEALTH_ANALYSIS") {
          failedAtString = "REPOSITORY_HEALTH";
        }

        logger.info(`[Pipeline] Starting stage: ${stageLabel} (Task: ${task.name})`);

        try {
          // Task execution with 5-minute timeout guard using Promise.race
          let taskTimeoutId: ReturnType<typeof setTimeout>;
          const timeoutGuard = new Promise<never>((_, reject) => {
            taskTimeoutId = setTimeout(() => {
              reject(new AppError(`Pipeline stage ${stageLabel} timed out after ${this.TASK_TIMEOUT_MS / 1000}s`, 504));
            }, this.TASK_TIMEOUT_MS);
          });

          await Promise.race([task.execute(this.ctx), timeoutGuard]);
          clearTimeout(taskTimeoutId!);

          logger.info(`[Pipeline] Completed stage: ${stageLabel}`);

          if (task.name === "CLONING") {
            summary.Clone = "✅";

            // Verify clone output on disk
            logger.info(`[Pipeline] Starting: Verify Clone filesystem metadata`);
            const { REPOSITORY_STORAGE_PATH } = await import("../../config");
            const repoPath = path.join(REPOSITORY_STORAGE_PATH, this.repositoryId);
            const gitPath = path.join(repoPath, ".git");
            if (!fs.existsSync(repoPath) || !fs.existsSync(gitPath)) {
              failedAtString = "CLONE_VERIFICATION";
              throw new AppError("Clone Verification Failed: Repository directory or .git metadata is missing.", 500);
            }
            logger.info(`[Pipeline] Completed: Verify Clone filesystem metadata`);
          } else if (task.name === "EXTRACTING") summary.Extract = "✅";
          else if (task.name === "CHUNKING") summary.Chunk = "✅";
          else if (task.name === "GENERATING_EMBEDDINGS") summary.Embedding = "✅";
          else if (task.name === "CALCULATING_METRICS") summary.Metrics = "✅";
          else if (task.name === "AI_HEALTH_ANALYSIS") summary.Health = "✅";

          this.ctx.completedStages.push(task.name);

          // Update completedStages in RepositoryProcessingStatus database model
          await prisma.repositoryProcessingStatus.update({
            where: { repositoryId: this.repositoryId },
            data: {
              completedStages: this.ctx.completedStages,
            },
          });
        } catch (taskErr: any) {
          const errMsg = taskErr.message || "Unknown error occurred.";
          const elapsed = Date.now() - taskStartTime;

          // Structured error logging
          logger.error(`[Pipeline Error] Repository ID: ${this.repositoryId}`);
          logger.error(`[Pipeline Error] Stage Name: ${stageLabel}`);
          logger.error(`[Pipeline Error] Error Message: ${errMsg}`);
          logger.error(`[Pipeline Error] Error Stack: ${taskErr.stack || taskErr}`);
          logger.error(`[Pipeline Error] Elapsed Time: ${elapsed} ms`);

          if (task.name === "CLONING") summary.Clone = "❌";
          else if (task.name === "EXTRACTING") summary.Extract = "❌";
          else if (task.name === "CHUNKING") summary.Chunk = "❌";
          else if (task.name === "GENERATING_EMBEDDINGS") summary.Embedding = "❌";
          else if (task.name === "CALCULATING_METRICS") summary.Metrics = "❌";
          else if (task.name === "AI_HEALTH_ANALYSIS") summary.Health = "❌";

          const failMsg = `${stageLabel} Failed: ${errMsg}`;
          this.ctx.failedStage = task.name;
          this.ctx.failureReason = failMsg;

          // Immediately update database status to FAILED
          await progressService.updateProgress(this.repositoryId, {
            errorMessage: failMsg,
            finishedAt: new Date(),
          });

          await prisma.repository.update({
            where: { id: this.repositoryId },
            data: { status: "FAILED" },
          });
          logger.info(`[PipelineManager] [Repository: ${this.repositoryId}] Status transitioned to: FAILED`);

          await prisma.repositoryProcessingStatus.update({
            where: { repositoryId: this.repositoryId },
            data: {
              failedStage: task.name,
              errorMessage: failMsg,
              duration: Math.round((Date.now() - startTime) / 1000),
              finishedAt: new Date(),
            },
          });

          printSummary();
          throw taskErr; // Never swallow exceptions
        }
      }

      // Final completion -> READY / COMPLETED
      this.ctx.duration = Math.round((Date.now() - startTime) / 1000);

      logger.info(`[Pipeline] Finalizing pipeline execution for ${this.repositoryId}`);
      await progressService.updateProgress(this.repositoryId, {
        currentStage: "Repository Ready",
        stageProgress: 100.0,
        currentMessage: "Repository processing completed successfully. AI Workspace is live!",
        finishedAt: new Date(),
      });

      await prisma.repository.update({
        where: { id: this.repositoryId },
        data: { status: "COMPLETED" },
      });
      logger.info(`[PipelineManager] [Repository: ${this.repositoryId}] Status transitioned to: COMPLETED`);

      await prisma.repositoryProcessingStatus.update({
        where: { repositoryId: this.repositoryId },
        data: {
          duration: this.ctx.duration,
          finishedAt: new Date(),
        },
      });

      logger.info(`[PipelineManager] Pipeline execution completed successfully in ${this.ctx.duration} seconds`);
      printSummary();
    } catch (err: any) {
      // In case any uncaught error outside the loop propagates
      const errMsg = err.message || "Unknown pipeline error.";
      logger.error(`[PipelineManager] Pipeline crashed for ${this.repositoryId}: ${errMsg}`, err);

      this.ctx.duration = Math.round((Date.now() - startTime) / 1000);

      await progressService.updateProgress(this.repositoryId, {
        errorMessage: errMsg,
        finishedAt: new Date(),
      });

      await prisma.repository.update({
        where: { id: this.repositoryId },
        data: { status: "FAILED" },
      });
      logger.info(`[PipelineManager] [Repository: ${this.repositoryId}] Status transitioned to: FAILED`);

      await prisma.repositoryProcessingStatus.update({
        where: { repositoryId: this.repositoryId },
        data: {
          failedStage: this.ctx.failedStage || "UNKNOWN",
          errorMessage: errMsg,
          duration: this.ctx.duration,
          finishedAt: new Date(),
        },
      });
      printSummary();
      throw err;
    } finally {
      this.stopHeartbeat();
    }
  }
}
