"use client"

import * as React from "react"
import { api } from "@/lib/api-client"

interface GitHubRepository {
  id: number
  name: string
  full_name: string
  owner: {
    login: string
  }
  private: boolean
  default_branch: string
  clone_url: string
  html_url: string
  description: string | null
  language: string | null
  stargazers_count: number
  forks_count: number
  watchers_count: number
}

interface FetchReposResponse {
  success: boolean
  repositories: GitHubRepository[]
}

export default function DevSyncUserPage() {
  // User Synchronization States
  const [loading, setLoading] = React.useState(false)
  const [response, setResponse] = React.useState<unknown>(null)
  const [error, setError] = React.useState<string | null>(null)

  // GitHub Repositories Fetching States
  const [loadingRepos, setLoadingRepos] = React.useState(false)
  const [responseRepos, setResponseRepos] = React.useState<FetchReposResponse | null>(null)
  const [errorRepos, setErrorRepos] = React.useState<string | null>(null)

  // Repository Import States
  const [importingRepoId, setImportingRepoId] = React.useState<number | null>(null)
  const [importResponse, setImportResponse] = React.useState<unknown>(null)
  const [importError, setImportError] = React.useState<string | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setResponse(null)
    setError(null)
    try {
      // POST to /api/v1/auth/sync (Next.js proxies to Express backend port 4000)
      const data = await api.post<unknown>("/v1/auth/sync")
      setResponse(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError("An unknown error occurred during synchronization.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleFetchRepos = async () => {
    setLoadingRepos(true)
    setResponseRepos(null)
    setErrorRepos(null)
    try {
      // GET from /api/v1/github/repositories
      const data = await api.get<FetchReposResponse>("/v1/github/repositories")
      setResponseRepos(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorRepos(err.message)
      } else {
        setErrorRepos("An unknown error occurred while retrieving repositories.")
      }
    } finally {
      setLoadingRepos(false)
    }
  }

  const handleImport = async (repo: GitHubRepository) => {
    setImportingRepoId(repo.id)
    setImportResponse(null)
    setImportError(null)

    const payload = {
      repositories: [
        {
          githubRepoId: String(repo.id),
          name: repo.name,
          fullName: repo.full_name,
          owner: repo.owner.login,
          visibility: repo.private ? "private" : "public",
          defaultBranch: repo.default_branch,
          cloneUrl: repo.clone_url,
          htmlUrl: repo.html_url,
          description: repo.description,
          primaryLanguage: repo.language,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          watchers: repo.watchers_count,
        }
      ]
    }

    try {
      const result = await api.post<unknown>("/v1/repositories/import", payload)
      setImportResponse(result)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setImportError(err.message)
      } else {
        setImportError("An unknown error occurred during repository import.")
      }
    } finally {
      setImportingRepoId(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-[#030712] p-6 text-foreground">
      <div className="w-full max-w-4xl rounded-xl border border-border/40 bg-[#0b0f19] p-6 shadow-2xl mt-10">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-foreground">Auth & GitHub Debugger</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Trigger local account synchronizations and import repositories to PostgreSQL.
        </p>

        {/* Buttons Action Bar */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleSync}
            disabled={loading || loadingRepos || importingRepoId !== null}
            className="flex-1 inline-flex h-11 items-center justify-center rounded-lg bg-primary px-4 py-2 font-semibold text-white shadow-md transition-all hover:bg-primary/95 focus:outline-none disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Synchronizing..." : "Synchronize User"}
          </button>
          
          <button
            onClick={handleFetchRepos}
            disabled={loading || loadingRepos || importingRepoId !== null}
            className="flex-1 inline-flex h-11 items-center justify-center rounded-lg border border-border/60 bg-[#111827] px-4 py-2 font-semibold text-foreground transition-all hover:bg-muted/40 focus:outline-none disabled:opacity-50 cursor-pointer"
          >
            {loadingRepos ? "Fetching repos..." : "Fetch GitHub Repositories"}
          </button>
        </div>

        {/* Display Sync Loader & Responses */}
        <div className="space-y-4">
          {/* Synchronize User Logs */}
          {loading && (
            <div className="flex items-center space-x-3 text-sm text-primary animate-pulse py-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Sending sync request to Express backend...</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <span className="font-semibold block mb-1">User Sync Error:</span>
              <p className="font-mono text-xs">{error}</p>
            </div>
          )}

          {!!response && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
              <span className="font-semibold block mb-2">User Sync Success Response:</span>
              <pre className="overflow-x-auto rounded-md bg-[#030712] p-3 font-mono text-xs text-foreground leading-relaxed">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}

          {/* GitHub Repositories Logs */}
          {loadingRepos && (
            <div className="flex items-center space-x-3 text-sm text-primary animate-pulse py-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Querying authorized repositories from Express API...</span>
            </div>
          )}

          {errorRepos && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              <span className="font-semibold block mb-1">GitHub Fetch Error:</span>
              <p className="font-mono text-xs">{errorRepos}</p>
            </div>
          )}
        </div>

        {/* Table of Repositories */}
        {!!responseRepos && responseRepos.repositories && (
          <div className="mt-8 border-t border-border/40 pt-6">
            <h2 className="mb-4 text-lg font-bold text-foreground">Discovered Repositories</h2>
            
            <div className="overflow-x-auto rounded-lg border border-border/40 bg-[#030712]">
              <table className="w-full text-left text-sm text-muted-foreground border-collapse">
                <thead className="bg-[#0b0f19] text-xs uppercase text-foreground">
                  <tr>
                    <th className="px-4 py-3 border-b border-border/40">Name</th>
                    <th className="px-4 py-3 border-b border-border/40">Owner</th>
                    <th className="px-4 py-3 border-b border-border/40">Visibility</th>
                    <th className="px-4 py-3 border-b border-border/40">Language</th>
                    <th className="px-4 py-3 border-b border-border/40">Stars</th>
                    <th className="px-4 py-3 border-b border-border/40 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {responseRepos.repositories.map((repo) => (
                    <tr key={repo.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground truncate max-w-[200px]" title={repo.name}>
                        {repo.name}
                      </td>
                      <td className="px-4 py-3">{repo.owner.login}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${
                          repo.private ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-green-500/10 text-green-400 border border-green-500/20"
                        }`}>
                          {repo.private ? "Private" : "Public"}
                        </span>
                      </td>
                      <td className="px-4 py-3">{repo.language || "N/A"}</td>
                      <td className="px-4 py-3">{repo.stargazers_count}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleImport(repo)}
                          disabled={importingRepoId !== null || loading || loadingRepos}
                          className="inline-flex h-8 items-center justify-center rounded bg-primary px-3 text-xs font-semibold text-white shadow-md hover:bg-primary/95 focus:outline-none disabled:opacity-50 cursor-pointer transition-all"
                        >
                          {importingRepoId === repo.id ? "Importing..." : "Import"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Display Import Response */}
            <div className="mt-4 space-y-3">
              {importingRepoId !== null && (
                <div className="flex items-center space-x-3 text-sm text-primary animate-pulse py-1">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span>Importing repository to PostgreSQL...</span>
                </div>
              )}

              {importError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
                  <span className="font-semibold block mb-1">Import Error:</span>
                  <p className="font-mono text-xs">{importError}</p>
                </div>
              )}

              {!!importResponse && (
                <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
                  <span className="font-semibold block mb-2">Import Success Response:</span>
                  <pre className="overflow-x-auto max-h-60 rounded-md bg-[#030712] p-3 font-mono text-xs text-foreground leading-relaxed">
                    {JSON.stringify(importResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
