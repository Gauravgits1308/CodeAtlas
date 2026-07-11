import { getGithubOAuthToken } from "./github-token"

declare global {
  interface Window {
    Clerk?: {
      session?: {
        getToken: (options?: unknown) => Promise<string | null>;
      };
    };
  }
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string>
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = "/api") {
    this.baseUrl = baseUrl
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
    
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value)
      })
    }

    const headers = new Headers(options.headers)
    headers.set("Content-Type", "application/json")

    // Retrieve tokens to authenticate backend API queries
    let clerkToken: string | null = null
    let githubToken: string | null = null

    if (typeof window !== "undefined") {
      // Client-side environment
      if (window.Clerk?.session) {
        clerkToken = await window.Clerk.session.getToken()
      }
      try {
        githubToken = await getGithubOAuthToken()
      } catch (err) {
        console.error("Failed to retrieve GitHub token on client-side API call:", err)
      }
    }

    if (clerkToken) {
      headers.set("Authorization", `Bearer ${clerkToken}`)
    }
    if (githubToken) {
      headers.set("X-Github-Token", githubToken)
    }

    const config: RequestInit = {
      ...options,
      headers,
    }

    const response = await fetch(url.toString(), config)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return response.json() as Promise<T>
  }

  public get<T>(path: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(path, { ...options, method: "GET" })
  }

  public post<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  public put<T>(path: string, data?: unknown, options?: Omit<RequestOptions, "method" | "body">): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  public delete<T>(path: string, options?: Omit<RequestOptions, "method">): Promise<T> {
    return this.request<T>(path, { ...options, method: "DELETE" })
  }

  public async stream(
    path: string,
    data: unknown,
    onChunk: (chunk: string) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const url = new URL(`${this.baseUrl}${path}`, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000")
    const headers = new Headers()
    headers.set("Content-Type", "application/json")

    let clerkToken: string | null = null
    if (typeof window !== "undefined" && window.Clerk?.session) {
      clerkToken = await window.Clerk.session.getToken()
    }
    if (clerkToken) {
      headers.set("Authorization", `Bearer ${clerkToken}`)
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      signal,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    const reader = response.body?.getReader()
    if (!reader) return

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      onChunk(decoder.decode(value))
    }
  }
}

export const api = new ApiClient()
