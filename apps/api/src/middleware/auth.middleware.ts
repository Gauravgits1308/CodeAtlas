/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req);

  if (!auth.userId) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized"
    });
  }

  // Populate req.auth matching types
  req.auth = {
    userId: auth.userId,
    sessionId: auth.sessionId || null,
    orgId: auth.orgId || null
  };

  next();
};
