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
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || "",
  clerkSecretKey: process.env.CLERK_SECRET_KEY || "",
  githubClientId: process.env.GITHUB_CLIENT_ID || "",
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || "",
}

// Warn about missing database connections
if (!config.databaseUrl) {
  console.warn("WARNING: DATABASE_URL environment variable is not defined.")
}
