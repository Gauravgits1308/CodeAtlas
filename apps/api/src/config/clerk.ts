import { clerkClient } from "@clerk/express";
import { config } from "./index";
import { logger } from "../utils/logger";

export const validateClerkConfig = (): void => {
  if (!config.clerkSecretKey) {
    throw new Error("CLERK_SECRET_KEY environment variable is required.");
  }

  logger.info("Clerk backend configured successfully.");
};

export { clerkClient };