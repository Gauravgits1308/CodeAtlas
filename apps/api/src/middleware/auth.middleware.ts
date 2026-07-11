/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { UserRepository } from "../repositories/user.repository";
import { logger } from "../utils/logger";

const userRepository = new UserRepository();

/**
 * Protected route middleware ensuring Clerk session authentication,
 * and automatically synchronizing Clerk user profiles to the local database.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }

  const userId = auth.userId;

  // Synchronize authenticated user profile to local database
  try {
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      logger.warn(`Clerk User ID ${userId} has no verified email address. User synchronization skipped.`);
    } else {
      const name = clerkUser.firstName && clerkUser.lastName
        ? `${clerkUser.firstName} ${clerkUser.lastName}`
        : clerkUser.firstName || clerkUser.lastName || null;

      // Determine created or updated event
      const existingUser = await userRepository.findByClerkId(userId);

      // Perform DB upsert
      await userRepository.upsert({
        id: userId,
        email,
        name,
      });

      if (!existingUser) {
        logger.info(`User synchronized: User created in database (ID: ${userId})`);
      } else {
        logger.info(`User synchronized: User updated in database (ID: ${userId})`);
      }
    }
  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Clerk user DB synchronization failure: ${err.message}`, err);
    // Allow request to proceed to handle existing data fallbacks or standard router errors
  }

  // Populate req.auth matching types
  req.auth = {
    userId,
    sessionId: auth.sessionId || null,
    orgId: auth.orgId || null,
  };

  next();
};
