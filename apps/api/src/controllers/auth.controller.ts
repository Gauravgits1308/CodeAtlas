/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";
import { asyncHandler } from "../utils/errors";

export class AuthController {
  constructor(private authService: AuthService) {}

  getCurrentUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const result = await this.authService.getCurrentUser(userId);
    
    res.status(200).json({
      success: true,
      message: result.message,
      endpoint: result.endpoint,
    });
  });

  syncUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const userId = req.auth.userId;
    const user = await this.authService.syncUser(userId);

    res.status(200).json({
      success: true,
      message: "User synchronized successfully.",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  });
}
