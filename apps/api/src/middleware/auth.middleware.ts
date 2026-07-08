import { Request, Response, NextFunction } from "express"
import { getAuth } from "@clerk/express"
import { AppError } from "../utils/errors"

// Route-level authentication blocker
export const requireAuthentication = (req: Request, res: Response, next: NextFunction) => {
  const auth = getAuth(req)
  if (!auth.userId) {
    return next(new AppError("Unauthorized: Authentication is required.", 401))
  }
  next()
}
