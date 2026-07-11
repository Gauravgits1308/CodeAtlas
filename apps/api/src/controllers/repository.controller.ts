/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import * as fs from "fs";
import * as path from "path";
import { RepositoryService, ImportRepositoryPayload } from "../services/repository.service";
import { RepositoryJobService } from "../services/repository-job.service";
import { asyncHandler, AppError } from "../utils/errors";
import { prisma } from "../database";

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
        };
      })
    );

    res.status(200).json({
      success: true,
      repositories: reposWithDetails,
    });
  });

  cloneRepository = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;

    const repository = await this.repositoryService.cloneRepository(id, userId);

    res.status(200).json({
      success: true,
      message: "Repository cloned successfully.",
      repository: {
        id: repository.id,
        name: repository.name,
        fullName: repository.fullName,
        status: repository.status,
        lastSyncedAt: repository.lastSyncedAt,
      },
    });
  });

  analyzeRepository = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const { id } = req.params;

    const metrics = await this.repositoryService.analyzeRepository(id, userId);

    res.status(200).json({
      success: true,
      metrics: {
        id: metrics.id,
        repositoryId: metrics.repositoryId,
        linesCount: metrics.linesCount,
        filesCount: metrics.filesCount,
        languages: metrics.languages,
        complexityScore: metrics.complexityScore,
        dependencyCount: metrics.dependencyCount,
        largestFiles: metrics.largestFiles,
        largestDirectories: metrics.largestDirectories,
        averageFileSize: metrics.averageFileSize,
        documentationCoverage: metrics.documentationCoverage,
        updatedAt: metrics.updatedAt,
      },
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

    const storagePath = path.join(__dirname, "../../../../storage/repositories", id);
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

    const storagePath = path.join(__dirname, "../../../../storage/repositories", id);
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
