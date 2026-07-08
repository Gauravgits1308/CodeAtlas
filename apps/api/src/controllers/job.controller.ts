/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { Job } from "bullmq";
import { repositoryQueue } from "../queue/repository.queue";
import { RepositoryRepository } from "../repositories/repository.repository";
import { asyncHandler, AppError } from "../utils/errors";

const repositoryRepository = new RepositoryRepository();

export class JobController {
  /**
   * Retrieves the current execution progress and status stage of a repository background job.
   */
  getJobStatus = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { jobId } = req.params;
    const userId = req.auth.userId;

    // Verify repository ownership for access control
    const repo = await repositoryRepository.findById(jobId);
    if (!repo) {
      return next(new AppError("Repository job not found.", 404));
    }

    if (repo.userId !== userId) {
      return next(new AppError("Forbidden: You do not own this repository.", 403));
    }

    // Query job directly from Redis connection pool
    const job = await Job.fromId(repositoryQueue, jobId);

    if (!job) {
      // Fall back to database status mapping if Redis removed the job on completion
      let state = "Queued";
      let progress = 0;
      let stage = "Queued";

      if (repo.status === "COMPLETED") {
        state = "Completed";
        progress = 100;
        stage = "Completed";
      } else if (repo.status === "FAILED") {
        state = "Failed";
        progress = 100;
        stage = "Failed";
      } else if (repo.status === "CLONING") {
        state = "Running";
        progress = 10;
        stage = "CLONING";
      } else if (repo.status === "ANALYZING") {
        state = "Running";
        progress = 40;
        stage = "ANALYZING";
      } else if (repo.status === "PROCESSING") {
        state = "Running";
        progress = 70;
        stage = "PROCESSING";
      } else if (repo.status === "QUEUED") {
        state = "Queued";
        progress = 0;
        stage = "Queued";
      }

      return res.status(200).json({
        success: true,
        jobId,
        state,
        progress,
        stage,
      });
    }

    // Resolve state name
    const bullState = await job.getState();
    let state = "Queued";
    if (bullState === "active") {
      state = "Running";
    } else if (bullState === "completed") {
      state = "Completed";
    } else if (bullState === "failed") {
      state = "Failed";
    }

    // Parse progress object structure
    let progress = 0;
    let stage = "Queued";

    if (job.progress) {
      if (typeof job.progress === "number") {
        progress = job.progress;
        stage = progress >= 100 ? "Completed" : "Running";
      } else if (typeof job.progress === "object" && job.progress !== null) {
        const p = job.progress as { progress?: number; stage?: string };
        progress = typeof p.progress === "number" ? p.progress : 0;
        stage = typeof p.stage === "string" ? p.stage : "Running";
      }
    }

    return res.status(200).json({
      success: true,
      jobId,
      state,
      progress,
      stage,
    });
  });
}
