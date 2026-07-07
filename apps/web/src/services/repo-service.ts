import { api } from "@/lib/api-client"
import type { Repository, RepositoryDetails } from "@/features/dashboard/types"

export const repoService = {
  listRepositories: async (): Promise<Repository[]> => {
    return api.get<Repository[]>("/repositories")
  },

  getRepository: async (id: string): Promise<RepositoryDetails> => {
    return api.get<RepositoryDetails>(`/repositories/${id}`)
  },

  importRepository: async (url: string): Promise<Repository> => {
    return api.post<Repository>("/repositories/import", { url })
  },

  deleteRepository: async (id: string): Promise<void> => {
    return api.delete<void>(`/repositories/${id}`)
  }
}
