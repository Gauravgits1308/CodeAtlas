import { RepositoryRepository, CreateRepositoryInput } from "../repositories/repository.repository";
import { Repository } from "@prisma/client";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { CloneService } from "./clone.service";
import { GitService } from "./git.service";
import { CodeMetricRepository } from "../repositories/code-metric.repository";

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

  constructor(
    repositoryRepository: RepositoryRepository,
    cloneService?: CloneService,
    codeMetricRepository?: CodeMetricRepository
  ) {
    this.repositoryRepository = repositoryRepository;
    this.cloneService = cloneService || new CloneService(new GitService(), repositoryRepository);
    this.codeMetricRepository = codeMetricRepository || new CodeMetricRepository();
  }

  /**
   * Batch imports or updates one or more GitHub repository records under the authenticated user.
   */
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

      console.log("[DEBUG IMPORT LOGS]", {
        "Authenticated Clerk user": userId,
        "Repository.userId": input.userId,
        "Repository.owner": input.owner,
        "Repository.name": input.name,
        "Repository.fullName": input.fullName,
      });

      const upserted = await this.repositoryRepository.upsert(input);
      logger.info(`[Repository: ${upserted.id}] Repository created in database`);
      importedRepos.push(upserted);
    }

    return importedRepos;
  }

  /**
   * Retrieves all imported repository records from PostgreSQL for the given user.
   */
  async getUserRepositories(userId: string): Promise<unknown[]> {
    return this.repositoryRepository.findByUser(userId);
  }

  async getRepositoryById(id: string, userId: string): Promise<unknown | null> {
    return this.repositoryRepository.findByIdAndUser(id, userId);
  }
}
