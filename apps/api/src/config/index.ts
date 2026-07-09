import dotenv from "dotenv"
import path from "path"

// Load environment variables from local .env
dotenv.config({ path: path.join(__dirname, "../../.env") })
dotenv.config() // Fallback to process env

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  redisHost: process.env.REDIS_HOST || "localhost",
  redisPort: parseInt(process.env.REDIS_PORT || "6379", 10),
  redisPassword: process.env.REDIS_PASSWORD || "",
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY || "",
  githubClientId: process.env.GITHUB_CLIENT_ID || "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",
  aiProvider: process.env.AI_PROVIDER || "openrouter",
  openrouterApiKey: process.env.OPENROUTER_API_KEY || "",
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
  openrouterEmbeddingModel: process.env.OPENROUTER_EMBEDDING_MODEL || "text-embedding-3-small",
}

// Warn about missing database connections
if (!config.databaseUrl) {
  console.warn("WARNING: DATABASE_URL environment variable is not defined.")
}
