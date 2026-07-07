import { Request, Response, NextFunction } from "express"
import { AppError } from "../utils/errors"
import { logger } from "../utils/logger"
import { config } from "../config"

// Global Express Error Middleware Interceptor
export const globalErrorHandler = (
  err: Error & { statusCode?: number; status?: string; isOperational?: boolean },
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || "error"

  if (config.nodeEnv === "development") {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: err.stack,
    })
  } else {
    // Production Environment: obfuscate internal stack trace details
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      })
    } else {
      logger.error("SYSTEM ERROR (Unintentional Failure):", err)
      res.status(500).json({
        status: "error",
        message: "Something went wrong on the server.",
      })
    }
  }
}

// Default 404 Route Interceptor
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Requested path '${req.originalUrl}' not found.`, 404))
}
