import { Request, Response, NextFunction } from "express"
import { AnyZodObject, ZodError } from "zod"
import { AppError } from "../utils/errors"

// Request schemas validator middleware
export const validateRequest = (schema: AnyZodObject) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      })
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => `${err.path.join(".")}: ${err.message}`).join(", ")
        next(new AppError(`Validation Error: ${errors}`, 400))
      } else {
        next(error)
      }
    }
  }
}
