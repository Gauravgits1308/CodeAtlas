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
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (
    !req.headers.authorization &&
    req.query.token &&
    typeof req.query.token === "string"
  ) {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }

  console.log("\n========== CLERK AUTH DEBUG ==========");
  console.log("Path:", req.originalUrl);
  console.log("Method:", req.method);

  console.log(
    "Authorization Header:",
    req.headers.authorization
      ? req.headers.authorization.substring(0, 40) + "..."
      : "MISSING"
  );

  console.log(
    "CLERK_SECRET_KEY:",
    process.env.CLERK_SECRET_KEY
      ? process.env.CLERK_SECRET_KEY.substring(0, 15) + "..."
      : "MISSING"
  );

  console.log(
    "CLERK_PUBLISHABLE_KEY:",
    process.env.CLERK_PUBLISHABLE_KEY
      ? process.env.CLERK_PUBLISHABLE_KEY.substring(0, 15) + "..."
      : "MISSING"
  );

  const auth = getAuth(req);

  console.log("getAuth(req):", auth);
  console.log("userId:", auth.userId);
  console.log("sessionId:", auth.sessionId);
  console.log("orgId:", auth.orgId);
  console.log("======================================\n");

  if (!auth.userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized",
      debug: {
        userId: auth.userId,
        sessionId: auth.sessionId,
      },
    });
  }

  const userId = auth.userId;

  try {
    const clerkUser = await clerkClient.users.getUser(userId);

    const email = clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      logger.warn(
        `Clerk User ID ${userId} has no verified email address.`
      );
    } else {
      const name =
        clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || clerkUser.lastName || null;

      const existingUser = await userRepository.findByClerkId(userId);

      await userRepository.upsert({
        id: userId,
        email,
        name,
      });

      if (!existingUser) {
        logger.info(
          `User synchronized: created (${userId})`
        );
      } else {
        logger.info(
          `User synchronized: updated (${userId})`
        );
      }
    }
  } catch (error) {
    logger.error(
      "Clerk user synchronization failed:",
      error
    );
  }

  req.auth = {
    userId,
    sessionId: auth.sessionId || null,
    orgId: auth.orgId || null,
  };

  next();
};
