import { RepositoryRepository, CreateRepositoryInput } from "../repositories/repository.repository";
import { Repository } from "@prisma/client";
import { AppError } from "../utils/errors";
import { CloneService } from "./clone.service";
import { GitService } from "./git.service";
import { CodeMetricRepository } from "../repositories/code-metric.repository";
import { RepositoryAnalysisService } from "./repository-analysis.service";

export interface ImportRepositoryPayload {
  githubRepoId: string | number;
  name: string;
  fullName: string;
  owner: string;
  visibility: string;
  defaultBranch: string;
  cloneUrl: string;
  htmlUrl: string;
  description?: string | null;
  primaryLanguage?: string | null;
  stars?: number;
  forks?: number;
  watchers?: number;
}

export class RepositoryService {
  private repositoryRepository: RepositoryRepository;
  private cloneService: CloneService;
  private codeMetricRepository: CodeMetricRepository;
  private repositoryAnalysisService: RepositoryAnalysisService;

  constructor(
    repositoryRepository: RepositoryRepository,
    cloneService?: CloneService,
    codeMetricRepository?: CodeMetricRepository,
    repositoryAnalysisService?: RepositoryAnalysisService
  ) {
    this.repositoryRepository = repositoryRepository;
    this.cloneService = cloneService || new CloneService(new GitService(), repositoryRepository);
    this.codeMetricRepository = codeMetricRepository || new CodeMetricRepository();
    this.repositoryAnalysisService = repositoryAnalysisService || new RepositoryAnalysisService();
  }

  async importRepositories(userId: string, payloads: ImportRepositoryPayload[]): Promise<Repository[]> {
    if (!payloads || !Array.isArray(payloads) || payloads.length === 0) {
      throw new AppError("No repositories provided for import.", 400);
    }

    const importedRepos: Repository[] = [];

    for (const payload of payloads) {
      // Validate required fields
      if (
        payload.githubRepoId === undefined ||
        payload.githubRepoId === null ||
        !payload.name ||
        !payload.fullName ||
        !payload.owner ||
        !payload.visibility ||
        !payload.defaultBranch ||
        !payload.cloneUrl ||
        !payload.htmlUrl
      ) {
        throw new AppError(`Missing required fields for repository import payload: ${payload.name || "unknown"}.`, 400);
      }

      const input: CreateRepositoryInput = {
        githubRepoId: String(payload.githubRepoId),
        name: payload.name,
        fullName: payload.fullName,
        owner: payload.owner,
        visibility: payload.visibility,
        defaultBranch: payload.defaultBranch,
        cloneUrl: payload.cloneUrl,
        htmlUrl: payload.htmlUrl,
        description: payload.description ?? null,
        primaryLanguage: payload.primaryLanguage ?? null,
        stars: payload.stars ?? 0,
        forks: payload.forks ?? 0,
        watchers: payload.watchers ?? 0,
        userId,
      };

      const upserted = await this.repositoryRepository.upsert(input);
      importedRepos.push(upserted);
    }

    return importedRepos;
  }

  async getUserRepositories(userId: string): Promise<Repository[]> {
    return this.repositoryRepository.findByUser(userId);
  }

  async cloneRepository(repositoryId: string, userId: string): Promise<Repository> {
    const repo = await this.repositoryRepository.findById(repositoryId);
    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }

    if (repo.userId !== userId) {
      throw new AppError("Forbidden: You do not own this repository.", 403);
    }

    await this.cloneService.cloneRepository(repo.id, repo.cloneUrl);

    const updatedRepo = await this.repositoryRepository.findById(repositoryId);
    if (!updatedRepo) {
      throw new AppError("Failed to retrieve updated repository status.", 500);
    }
    return updatedRepo;
  }

  async analyzeRepository(repositoryId: string, userId: string) {
    const repo = await this.repositoryRepository.findById(repositoryId);
    if (!repo) {
      throw new AppError("Repository not found.", 404);
    }

    if (repo.userId !== userId) {
      throw new AppError("Forbidden: You do not own this repository.", 403);
    }

    if (repo.status !== "COMPLETED" && repo.status !== "FAILED") {
      throw new AppError("Repository codebase must be cloned successfully before triggering analysis.", 400);
    }

    await this.repositoryRepository.updateStatus(repo.id, "ANALYZING");

    try {
      const results = await this.repositoryAnalysisService.analyze(repo.id);

      const metrics = await this.codeMetricRepository.createOrUpdate({
        repositoryId: repo.id,
        linesCount: results.linesCount,
        filesCount: results.filesCount,
        languages: results.languages,
        dependencyCount: results.dependencyCount,
        largestFiles: results.largestFiles,
        largestDirectories: results.largestDirectories,
        averageFileSize: results.averageFileSize,
      });

      await this.repositoryRepository.updateStatus(repo.id, "COMPLETED");

      return metrics;
    } catch (error) {
      await this.repositoryRepository.updateStatus(repo.id, "FAILED");
      throw error;
    }
  }
}
