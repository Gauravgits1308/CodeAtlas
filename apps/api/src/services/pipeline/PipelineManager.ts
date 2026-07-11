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
    logger.info(`[Pipeline] Started`);
 
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
 
        if (task.name === "CLONING") logger.info(`[Repository: ${this.repositoryId}] Cloning started`);
        else if (task.name === "EXTRACTING") logger.info(`[Repository: ${this.repositoryId}] Extraction started`);
        else if (task.name === "CHUNKING") logger.info(`[Repository: ${this.repositoryId}] Chunking started`);
        else if (task.name === "GENERATING_EMBEDDINGS") logger.info(`[Repository: ${this.repositoryId}] Embedding generation started`);
        else if (task.name === "CALCULATING_METRICS") logger.info(`[Repository: ${this.repositoryId}] Metrics calculation started`);
        else if (task.name === "AI_HEALTH_ANALYSIS") logger.info(`[Repository: ${this.repositoryId}] AI Health analysis started`);
        logger.info(`[PipelineManager] [${task.name}] Started`);
        
        try {
          await task.execute(this.ctx);
          
          const taskDuration = (Date.now() - taskStartTime) / 1000;
          logger.info(`[PipelineManager] [${task.name}] Completed in ${taskDuration.toFixed(2)} seconds`);
 
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
          logger.error(`[PipelineManager] [${task.name}] Failed: ${errMsg}`);
          
          this.ctx.failedStage = task.name;
          this.ctx.failureReason = errMsg;
 
          // Determine critical vs optional failure
          const isCritical = ["CLONING", "EXTRACTING", "CHUNKING"].includes(task.name);
          if (isCritical) {
            throw taskErr;
          } else {
            // Optional stage failed -> isolate failure, update status to PARTIALLY_INDEXED and continue or stop gracefully
            logger.warn(`[PipelineManager] Isolate failure: optional task ${task.name} failed, marking repository as PARTIALLY_INDEXED`);
            
            this.ctx.duration = Math.round((Date.now() - startTime) / 1000);
            await progressService.updateProgress(this.repositoryId, {
              errorMessage: `Optional stage ${task.name} failed: ${errMsg}`,
              finishedAt: new Date(),
            });
 
            await prisma.repository.update({
              where: { id: this.repositoryId },
              data: { status: "PARTIALLY_INDEXED" },
            });
            logger.info(`[PipelineManager] [Repository: ${this.repositoryId}] Repository status transitioned to: PARTIALLY_INDEXED`);
 
            await prisma.repositoryProcessingStatus.update({
              where: { repositoryId: this.repositoryId },
              data: {
                failedStage: this.ctx.failedStage,
                errorMessage: `Optional stage ${task.name} failed: ${errMsg}`,
                duration: this.ctx.duration,
              },
            });
            
            this.stopHeartbeat();
            return;
          }
        }
      }
 
      // If all tasks complete successfully -> READY
      this.ctx.duration = Math.round((Date.now() - startTime) / 1000);
 
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
 
      logger.info(`[Repository: ${this.repositoryId}] Repository ready`);
      logger.info(`[PipelineManager] Pipeline execution completed successfully in ${this.ctx.duration} seconds`);
    } catch (err: any) {
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
    } finally {
      this.stopHeartbeat();
    }
  }
}
