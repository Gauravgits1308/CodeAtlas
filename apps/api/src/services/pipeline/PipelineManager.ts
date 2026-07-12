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
 
export class PipelineManager {
  private repositoryId: string;
  private userId: string;
  private ctx: PipelineContext;
  private tasks: PipelineTask[];
  private heartbeatInterval: NodeJS.Timeout | null = null;
 
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
 
    logger.info(`[Pipeline] Starting: Queue`);
    logger.info(`[Pipeline] Completed: Queue`);
    logger.info(`[Pipeline] Started`);
 
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
    logger.info(`[PipelineManager] [Repository: ${this.repositoryId}] Repository status transitioned to: QUEUED`);
 
    await progressService.updateProgress(this.repositoryId, {
      currentStage: "QUEUED",
      stageProgress: 0.0,
      currentMessage: "Starting task execution pipeline...",
      finishedAt: null,
    });
 
    try {
      for (const task of this.tasks) {
        const taskStartTime = Date.now();
        
        let displayStage = task.name;
        let progressPercent = 0.0;
        let displayMessage = "";
 
        if (task.name === "CLONING") {
          displayStage = "Cloning Repository";
          progressPercent = 15.0;
          displayMessage = "Cloning files from GitHub...";
        } else if (task.name === "EXTRACTING") {
          displayStage = "Extracting Files";
          progressPercent = 35.0;
          displayMessage = "Extracting supported source files from directory structure...";
        } else if (task.name === "CHUNKING") {
          displayStage = "Chunking Code";
          progressPercent = 50.0;
          displayMessage = "Chunking codebase files into semantic windows...";
        } else if (task.name === "GENERATING_EMBEDDINGS") {
          displayStage = "Generating Embeddings";
          progressPercent = 75.0;
          displayMessage = "Generating vector embeddings for chunks...";
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
        if (task.name === "CLONING") dbStatus = "CLONING";
        else if (task.name === "CALCULATING_METRICS") dbStatus = "ANALYZING";
 
        await prisma.repository.update({
          where: { id: this.repositoryId },
          data: { status: dbStatus },
        });
        logger.info(`[PipelineManager] [Repository: ${this.repositoryId}] Repository status transitioned to: ${dbStatus}`);
 
        await progressService.updateProgress(this.repositoryId, {
          currentStage: displayStage,
          stageProgress: progressPercent,
          currentMessage: displayMessage,
        });
 
        let stageLabel = "";
        let failedAtString = "UNKNOWN";
        if (task.name === "CLONING") {
          stageLabel = "Clone Repository";
          failedAtString = "CLONE_REPOSITORY";
        } else if (task.name === "EXTRACTING") {
          stageLabel = "Extract Files";
          failedAtString = "FILE_EXTRACTION";
        } else if (task.name === "CHUNKING") {
          stageLabel = "Chunk Files";
          failedAtString = "FILE_CHUNKING";
        } else if (task.name === "GENERATING_EMBEDDINGS") {
          stageLabel = "Generate Embeddings";
          failedAtString = "GENERATING_EMBEDDINGS";
        } else if (task.name === "CALCULATING_METRICS") {
          stageLabel = "Calculate Metrics";
          failedAtString = "CALCULATING_METRICS";
        } else if (task.name === "AI_HEALTH_ANALYSIS") {
          stageLabel = "Repository Health";
          failedAtString = "REPOSITORY_HEALTH";
        }
 
        logger.info(`[Pipeline] Starting: ${stageLabel}`);
        
        try {
          if (task.name === "CLONING") {
            await task.execute(this.ctx);
            logger.info(`[Pipeline] Completed: ${stageLabel}`);
            summary.Clone = "✅";
 
            // Explicit clone verification stage
            logger.info(`[Pipeline] Starting: Verify Clone`);
            const repoPath = path.join(__dirname, "../../../../../storage/repositories", this.repositoryId);
            const gitPath = path.join(repoPath, ".git");
            if (!fs.existsSync(repoPath) || !fs.existsSync(gitPath)) {
              failedAtString = "CLONE_VERIFICATION";
              throw new Error("Clone Verification Failed: Repository checkout directory or .git metadata is missing.");
            }
            logger.info(`[Pipeline] Completed: Verify Clone`);
          } else {
            await task.execute(this.ctx);
            logger.info(`[Pipeline] Completed: ${stageLabel}`);
 
            if (task.name === "EXTRACTING") summary.Extract = "✅";
            else if (task.name === "CHUNKING") summary.Chunk = "✅";
            else if (task.name === "GENERATING_EMBEDDINGS") summary.Embedding = "✅";
            else if (task.name === "CALCULATING_METRICS") summary.Metrics = "✅";
            else if (task.name === "AI_HEALTH_ANALYSIS") summary.Health = "✅";
          }
 
          this.ctx.completedStages.push(task.name);
 
          // Update completedStages inside RepositoryProcessingStatus database model
          await prisma.repositoryProcessingStatus.update({
            where: { repositoryId: this.repositoryId },
            data: {
              completedStages: this.ctx.completedStages,
            },
          });
        } catch (taskErr: any) {
          const errMsg = taskErr.message || "Unknown error occurred.";
          const elapsed = Date.now() - taskStartTime;
 
          // Structured logging of error
          logger.error(`[Pipeline Error] Repository ID: ${this.repositoryId}`);
          logger.error(`[Pipeline Error] Stage Name: ${stageLabel}`);
          logger.error(`[Pipeline Error] Error Stack: ${taskErr.stack || taskErr}`);
          logger.error(`[Pipeline Error] Elapsed Time: ${elapsed} ms`);
 
          if (task.name === "CLONING") {
            summary.Clone = "❌";
          } else if (task.name === "EXTRACTING") {
            summary.Extract = "❌";
          } else if (task.name === "CHUNKING") {
            summary.Chunk = "❌";
          } else if (task.name === "GENERATING_EMBEDDINGS") {
            summary.Embedding = "❌";
          } else if (task.name === "CALCULATING_METRICS") {
            summary.Metrics = "❌";
          } else if (task.name === "AI_HEALTH_ANALYSIS") {
            summary.Health = "❌";
          }
 
          const failMsg = `FAILED_AT = ${failedAtString}`;
          this.ctx.failedStage = task.name;
          this.ctx.failureReason = failMsg;
 
          // Immediately update database status to FAILED with the exact stage name
          await progressService.updateProgress(this.repositoryId, {
            errorMessage: failMsg,
            finishedAt: new Date(),
          });
 
          await prisma.repository.update({
            where: { id: this.repositoryId },
            data: { status: "FAILED" },
          });
          logger.info(`[PipelineManager] [Repository: ${this.repositoryId}] Repository status transitioned to: FAILED`);
 
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
          throw taskErr; // never swallow exception
        }
      }
 
      // If all tasks complete successfully -> READY
      this.ctx.duration = Math.round((Date.now() - startTime) / 1000);
 
      logger.info(`[Pipeline] Starting: Completed`);
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
      logger.info(`[PipelineManager] [Repository: ${this.repositoryId}] Repository status transitioned to: COMPLETED`);
 
      await prisma.repositoryProcessingStatus.update({
        where: { repositoryId: this.repositoryId },
        data: {
          duration: this.ctx.duration,
          finishedAt: new Date(),
        },
      });
      logger.info(`[Pipeline] Completed: Completed`);
 
      logger.info(`[Repository: ${this.repositoryId}] Repository ready`);
      logger.info(`[PipelineManager] Pipeline execution completed successfully in ${this.ctx.duration} seconds`);
      printSummary();
    } catch (err: any) {
      // In case any uncaught error outside the loop propagates
      const errMsg = err.message || "Unknown pipeline error.";
      logger.error(`[PipelineManager] Pipeline execution crashed: ${errMsg}`, err);
 
      this.ctx.duration = Math.round((Date.now() - startTime) / 1000);
 
      await progressService.updateProgress(this.repositoryId, {
        errorMessage: errMsg,
        finishedAt: new Date(),
      });
 
      await prisma.repository.update({
        where: { id: this.repositoryId },
        data: { status: "FAILED" },
      });
      logger.info(`[PipelineManager] [Repository: ${this.repositoryId}] Repository status transitioned to: FAILED`);
 
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
