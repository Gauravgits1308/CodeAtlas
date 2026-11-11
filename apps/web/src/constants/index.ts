export const APP_CONFIG = {
  TITLE: "Revora",
  DESCRIPTION: "AI-powered developer platform to search, document, navigate and analyze software repositories.",
} as const

export const LOCAL_STORAGE_KEYS = {
  SESSION: "revora:session",
  THEME: "revora:theme",
  SIDEBAR_COLLAPSED: "revora:sidebar:collapsed",
} as const

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    ME: "/auth/me",
  },
  REPOSITORIES: {
    BASE: "/repositories",
    IMPORT: "/repositories/import",
    DETAILS: (id: string) => `/repositories/${id}`,
  },
} as const
