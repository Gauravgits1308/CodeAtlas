import { PrismaClient } from "@prisma/client"
import { logger } from "../utils/logger"

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}

// Database connectivity checker
export const connectDb = async (): Promise<void> => {
  try {
    await prisma.$connect()
    logger.info("Prisma connected to PostgreSQL successfully.")
  } catch (error) {
    logger.error("Database connection failure. Continuing bootstrap in degraded state:", error)
  }
}
