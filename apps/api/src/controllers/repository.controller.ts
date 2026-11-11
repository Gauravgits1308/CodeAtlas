/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import * as fs from "fs";
import * as path from "path";
import { RepositoryService, ImportRepositoryPayload } from "../services/repository.service";
import { RepositoryJobService } from "../services/repository-job.service";
import { asyncHandler, AppError } from "../utils/errors";
import { prisma } from "../database";
import { logger } from "../utils/logger";
import { REPOSITORY_STORAGE_PATH } from "../config";

export class RepositoryController {
  private repositoryJobService: RepositoryJobService;

  constructor(
    private repositoryService: RepositoryService,
    repositoryJobService?: RepositoryJobService
  ) {
    this.repositoryJobService = repositoryJobService || new RepositoryJobService();
  }

  importRepositories = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    logger.info(`[IMPORT_REQ] [START] Request received at ${new Date().toISOString()}`);

    const userId = req.auth.userId;
    const { repositories } = req.body as { repositories?: ImportRepositoryPayload[] };

    if (!repositories || !Array.isArray(repositories)) {
      logger.error(`[IMPORT_REQ] [VALIDATE_INPUT] Invalid payload shape`);
      return next(new AppError("Invalid payload shape: repositories list is required and must be an array.", 400));
    }

    logger.info(`[IMPORT_REQ] [VALIDATE_INPUT] Input validated successfully. Count: ${repositories.length}`);

    logger.info(`[IMPORT_REQ] [CREATE_DATABASE_RECORD] Creating repository database records...`);
    const imported = await this.repositoryService.importRepositories(userId, repositories);
    logger.info(`[IMPORT_REQ] [CREATE_DATABASE_RECORD] Created ${imported.length} database records.`);

    // Enqueue jobs for all newly imported repositories so they transition to QUEUED and process immediately
    for (const repo of imported) {
      try {
        logger.info(`[IMPORT_REQ] [ADD_JOB_TO_BULLMQ] Enqueuing job for repository: ${repo.id}`);
        const jobId = await this.repositoryJobService.enqueueRepository(repo.id, userId);
        logger.info(`[IMPORT_REQ] [ADD_JOB_TO_BULLMQ] Job successfully enqueued: ${jobId}`);
      } catch (enqueueErr) {
        logger.error(`[IMPORT_REQ] [ADD_JOB_TO_BULLMQ] Failed to auto-enqueue repository ${repo.id}:`, enqueueErr);
      }
    }

    const elapsed = Date.now() - startTime;
    logger.info(`[IMPORT_REQ] [RETURN_RESPONSE] Returning HTTP 201 Created in ${elapsed}ms`);

    res.status(201).json({
      success: true,
      imported: imported.length,
      repositories: imported.map((repo) => ({
        id: repo.id,
        githubRepoId: repo.githubRepoId,
        name: repo.name,
        fullName: repo.fullName,
        owner: repo.owner,
        visibility: repo.visibility,
        defaultBranch: repo.defaultBranch,
        cloneUrl: repo.cloneUrl,
        htmlUrl: repo.htmlUrl,
        description: repo.description,
        primaryLanguage: repo.primaryLanguage,
        stars: repo.stars,
        forks: repo.forks,
        watchers: repo.watchers,
        status: repo.status,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
      })),
    });
  });

  getUserRepositories = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const repositories = await this.repositoryService.getUserRepositories(userId);

    const reposWithDetails = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      repositories.map(async (repo: any) => {
        const embeddingCount = await prisma.chunkEmbedding.count({
          where: {
            chunk: {
              repositoryId: repo.id,
            },
          },
        });

        const classificationCounts = await prisma.codeChunk.groupBy({
          by: ["classification"],
          where: {
            repositoryId: repo.id,
          },
          _count: {
            _all: true,
          },
        });

        const classifications = {
          SOURCE_CODE: 0,
          MARKUP: 0,
          STYLESHEET: 0,
          CONFIGURATION: 0,
          DOCUMENTATION: 0,
        };

        for (const group of classificationCounts) {
          if (group.classification) {
            const key = group.classification as keyof typeof classifications;
            if (key in classifications) {
              classifications[key] = group._count._all;
            }
          }
        }

        return {
          id: repo.id,
          githubRepoId: repo.githubRepoId,
          name: repo.name,
          fullName: repo.fullName,
          owner: repo.owner,
          visibility: repo.visibility,
          defaultBranch: repo.defaultBranch,
          cloneUrl: repo.cloneUrl,
          htmlUrl: repo.htmlUrl,
          description: repo.description,
          primaryLanguage: repo.primaryLanguage,
          stars: repo.stars,
          forks: repo.forks,
          watchers: repo.watchers,
          status: repo.status,
          lastSyncedAt: repo.lastSyncedAt,
          createdAt: repo.createdAt,
          updatedAt: repo.updatedAt,
          metrics: repo.metrics
            ? {
                linesCount: repo.metrics.linesCount,
                filesCount: repo.metrics.filesCount,
                complexityScore: repo.metrics.complexityScore,
                dependencyCount: repo.metrics.dependencyCount,
                languages: repo.metrics.languages,
              }
            : null,
          chunksCount: repo._count?.chunks || 0,
          embeddingsCount: embeddingCount,
          classifications,
          isArchived: repo.isArchived,
        };
      })
    );

    res.status(200).json({
      success: true,
      repositories: reposWithDetails,
    });
  });


  processRepository = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;

    const jobId = await this.repositoryJobService.enqueueRepository(id, userId);

    res.status(202).json({
      success: true,
      jobId,
      status: "QUEUED",
    });
  });

  getRepositoryFiles = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!dbUser) {
      throw new AppError("User not synchronized in local database.", 401);
    }

    const repository = await prisma.repository.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    });

    if (!repository) {
      throw new AppError("Repository not found or access denied.", 404);
    }

    const storagePath = path.join(REPOSITORY_STORAGE_PATH, id);
    if (!fs.existsSync(storagePath)) {
      throw new AppError("Repository files not found on disk. Please trigger sync.", 404);
    }

    const filesTree = buildFileTree(storagePath, storagePath);

    res.status(200).json({
      success: true,
      files: filesTree,
    });
  });

  getRepositoryFileContent = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;
    const filePathQuery = req.query.path as string;

    if (!filePathQuery || typeof filePathQuery !== "string" || !filePathQuery.trim()) {
      throw new AppError("File path query parameter is required.", 400);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!dbUser) {
      throw new AppError("User not synchronized in local database.", 401);
    }

    const repository = await prisma.repository.findFirst({
      where: {
        id,
        userId: dbUser.id,
      },
    });

    if (!repository) {
      throw new AppError("Repository not found or access denied.", 404);
    }

    const storagePath = path.join(REPOSITORY_STORAGE_PATH, id);
    const targetFilePath = path.join(storagePath, filePathQuery);

    const relative = path.relative(storagePath, targetFilePath);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new AppError("Access denied: Invalid file path.", 403);
    }

    if (!fs.existsSync(targetFilePath)) {
      throw new AppError("Requested file not found in repository.", 404);
    }

    const stat = fs.statSync(targetFilePath);
    if (stat.isDirectory()) {
      throw new AppError("Requested path is a directory, not a file.", 400);
    }

    if (stat.size > 1500000) {
      throw new AppError("File is too large to visualize.", 400);
    }

    const content = fs.readFileSync(targetFilePath, "utf-8");

    res.status(200).json({
      success: true,
      content,
    });
  });

  cancelRepository = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;

    await this.repositoryJobService.cancelRepository(id, userId);

    res.status(200).json({
      success: true,
      message: "Repository processing cancelled successfully.",
      status: "CANCELLED",
    });
  });

  retryRepository = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;

    const jobId = await this.repositoryJobService.retryRepository(id, userId);

    res.status(200).json({
      success: true,
      jobId,
      message: "Repository processing retried successfully.",
      status: "QUEUED",
    });
  });

  deleteRepository = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id: repositoryId } = req.params;

    if (!repositoryId || typeof repositoryId !== "string" || !repositoryId.trim()) {
      throw new AppError("Repository ID is required.", 400);
    }

    const repository = await prisma.repository.findFirst({
      where: { id: repositoryId, userId },
    });

    if (!repository) {
      throw new AppError("Repository not found or access denied.", 404);
    }

    // Cancel active BullMQ job and clean files prior to DB record deletion
    try {
      await this.repositoryJobService.cancelRepository(repositoryId, userId);
    } catch (cancelErr) {
      logger.warn(`Failed to cancel active job prior to deletion for ${repositoryId}: ${cancelErr}`);
    }

    const startTime = Date.now();
    logger.info(`Deletion Started for repository: ${repositoryId} (${repository.fullName})`);

    try {
      // 1. Delete Messages & Conversations
      const conversations = await prisma.conversation.findMany({ where: { repositoryId } });
      const conversationIds = conversations.map(c => c.id);
      const deletedMessages = await prisma.message.deleteMany({ where: { conversationId: { in: conversationIds } } });
      const deletedConversations = await prisma.conversation.deleteMany({ where: { repositoryId } });

      // 2. Delete Health Reports / cache files
      const apiStoragePath = path.join(REPOSITORY_STORAGE_PATH, repositoryId);
      if (fs.existsSync(apiStoragePath)) {
        fs.rmSync(apiStoragePath, { recursive: true, force: true });
      }

      // 3. Delete Metrics
      await prisma.codeMetric.deleteMany({ where: { repositoryId } });

      // 4. Delete Embeddings & Chunks
      const chunks = await prisma.codeChunk.findMany({ where: { repositoryId } });
      const chunkIds = chunks.map(c => c.id);
      const deletedEmbeddings = await prisma.chunkEmbedding.deleteMany({ where: { chunkId: { in: chunkIds } } });
      const deletedChunks = await prisma.codeChunk.deleteMany({ where: { repositoryId } });

      // 5. Delete Local Repository Folder
      const gitStoragePath = path.join(REPOSITORY_STORAGE_PATH, repositoryId);
      if (fs.existsSync(gitStoragePath)) {
        fs.rmSync(gitStoragePath, { recursive: true, force: true });
      }

      // 6. Delete Processing Status & Repository Record
      await prisma.repositoryProcessingStatus.deleteMany({ where: { repositoryId } });
      await prisma.repository.delete({ where: { id: repositoryId } });

      const cleanupTime = Date.now() - startTime;
      logger.info(`Deletion Completed for repository: ${repositoryId}. Cleanup Time: ${cleanupTime}ms. Deleted Chunks: ${deletedChunks.count}, Deleted Embeddings: ${deletedEmbeddings.count}, Deleted Messages: ${deletedMessages.count}, Deleted Conversations: ${deletedConversations.count}`);

      res.status(200).json({
        success: true,
        message: "Repository removed successfully.",
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Deletion Failed for repository: ${repositoryId}. Error: ${error.message}`, error);
      throw new AppError(`Unable to remove repository: ${error.message}`, 500);
    }
  });

  archiveRepository = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id: repositoryId } = req.params;

    const repository = await prisma.repository.findFirst({
      where: { id: repositoryId, userId },
    });

    if (!repository) {
      throw new AppError("Repository not found or access denied.", 404);
    }

    await prisma.repository.update({
      where: { id: repositoryId },
      data: { isArchived: true },
    });

    res.status(200).json({
      success: true,
      message: "Repository archived successfully.",
    });
  });

  restoreRepository = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id: repositoryId } = req.params;

    const repository = await prisma.repository.findFirst({
      where: { id: repositoryId, userId },
    });

    if (!repository) {
      throw new AppError("Repository not found or access denied.", 404);
    }

    await prisma.repository.update({
      where: { id: repositoryId },
      data: { isArchived: false },
    });

    res.status(200).json({
      success: true,
      message: "Repository restored successfully.",
    });
  });

  getRepository = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;

    if (!id || typeof id !== "string" || !id.trim()) {
      throw new AppError("Repository ID is required.", 400);
    }

    interface RepositoryWithDetails {
      id: string;
      githubRepoId: string;
      name: string;
      fullName: string;
      owner: string;
      visibility: string;
      defaultBranch: string;
      cloneUrl: string;
      htmlUrl: string;
      description: string | null;
      primaryLanguage: string | null;
      stars: number;
      forks: number;
      watchers: number;
      status: string;
      lastSyncedAt: Date | null;
      createdAt: Date;
      updatedAt: Date;
      metrics?: {
        linesCount: number;
        filesCount: number;
        complexityScore: number | null;
        dependencyCount: number | null;
        languages: unknown;
      } | null;
      _count?: {
        chunks: number;
      };
      isArchived: boolean;
    }

    const repo = (await this.repositoryService.getRepositoryById(id, userId)) as RepositoryWithDetails | null;
    if (!repo) {
      throw new AppError("Repository not found or access denied.", 404);
    }

    const embeddingCount = await prisma.chunkEmbedding.count({
      where: {
        chunk: {
          repositoryId: repo.id,
        },
      },
    });

    const classificationCounts = await prisma.codeChunk.groupBy({
      by: ["classification"],
      where: {
        repositoryId: repo.id,
      },
      _count: {
        _all: true,
      },
    });

    const classifications = {
      SOURCE_CODE: 0,
      MARKUP: 0,
      STYLESHEET: 0,
      CONFIGURATION: 0,
      DOCUMENTATION: 0,
    };

    for (const group of classificationCounts) {
      if (group.classification) {
        const key = group.classification as keyof typeof classifications;
        if (key in classifications) {
          classifications[key] = group._count._all;
        }
      }
    }

    res.status(200).json({
      success: true,
      repository: {
        id: repo.id,
        githubRepoId: repo.githubRepoId,
        name: repo.name,
        fullName: repo.fullName,
        owner: repo.owner,
        visibility: repo.visibility,
        defaultBranch: repo.defaultBranch,
        cloneUrl: repo.cloneUrl,
        htmlUrl: repo.htmlUrl,
        description: repo.description,
        primaryLanguage: repo.primaryLanguage,
        stars: repo.stars,
        forks: repo.forks,
        watchers: repo.watchers,
        status: repo.status,
        lastSyncedAt: repo.lastSyncedAt,
        createdAt: repo.createdAt,
        updatedAt: repo.updatedAt,
        metrics: repo.metrics
          ? {
              linesCount: repo.metrics.linesCount,
              filesCount: repo.metrics.filesCount,
              complexityScore: repo.metrics.complexityScore,
              dependencyCount: repo.metrics.dependencyCount,
              languages: repo.metrics.languages,
            }
          : null,
        chunksCount: repo._count?.chunks || 0,
        embeddingsCount: embeddingCount,
        classifications,
        isArchived: repo.isArchived,
      },
    });
  });
}

// Recursive helper to build repository file tree ignoring non-relevant nodes
interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileTreeNode[];
}

function buildFileTree(dirPath: string, rootDir: string): FileTreeNode[] {
  const items = fs.readdirSync(dirPath);
  const nodes: FileTreeNode[] = [];

  const ignoreFolders = [".git", "node_modules", "dist", "build", ".next", ".cache", "tmp", "coverage"];
  const ignoreFiles = [".DS_Store", "thumbs.db"];

  for (const item of items) {
    if (ignoreFolders.includes(item) || ignoreFiles.includes(item)) {
      continue;
    }

    const fullPath = path.join(dirPath, item);
    const relativePath = path.relative(rootDir, fullPath);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      nodes.push({
        name: item,
        path: relativePath,
        type: "directory",
        children: buildFileTree(fullPath, rootDir),
      });
    } else {
      nodes.push({
        name: item,
        path: relativePath,
        type: "file",
      });
    }
  }

  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}
