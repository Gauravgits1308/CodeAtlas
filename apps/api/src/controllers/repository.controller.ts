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
    const userId = req.auth.userId;
    const { repositories } = req.body as { repositories?: ImportRepositoryPayload[] };

    if (!repositories || !Array.isArray(repositories)) {
      return next(new AppError("Invalid payload shape: repositories list is required and must be an array.", 400));
    }

    const imported = await this.repositoryService.importRepositories(userId, repositories);
 
    // Enqueue jobs for all newly imported repositories so they transition to QUEUED and process immediately
    for (const repo of imported) {
      try {
        logger.info(`[RepositoryController] Triggering auto-enqueue for newly imported repository: ${repo.id}`);
        await this.repositoryJobService.enqueueRepository(repo.id, userId);
      } catch (enqueueErr) {
        logger.error(`[RepositoryController] Failed to auto-enqueue repository ${repo.id} during import:`, enqueueErr);
      }
    }

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

    // Worker Safety: Prevent deletion if currently processing
    const processingStates = ["QUEUED", "CLONING", "ANALYZING", "PROCESSING"];
    if (processingStates.includes(repository.status)) {
      throw new AppError("Repository is currently processing. Wait until processing finishes.", 400);
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
