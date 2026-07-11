export interface GitHubRepositoryDto {
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
  updatedAt: string;
}
