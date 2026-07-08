import { RepositoryRepository, CreateRepositoryInput } from "../repositories/repository.repository";
import { Repository } from "@prisma/client";
import { AppError } from "../utils/errors";

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
  constructor(private repositoryRepository: RepositoryRepository) {}

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
}
