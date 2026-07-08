import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/errors";

export class AuthController {
  getCurrentUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    res.status(200).json({
      success: true,
      message: "Auth route registered successfully.",
      endpoint: "/me",
    });
  });

  syncUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    res.status(200).json({
      success: true,
      message: "Sync endpoint registered successfully.",
    });
  });
}
