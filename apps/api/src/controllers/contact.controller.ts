import { Request, Response, NextFunction } from "express";
import { asyncHandler, AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { config } from "../config";

export class ContactController {
  /**
   * Receives and validates contact form queries.
   */
  submitContact = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, subject, message } = req.body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    if (!name || typeof name !== "string" || !name.trim()) {
      return next(new AppError("Name is required and must be a valid string.", 400));
    }
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return next(new AppError("A valid email address is required.", 400));
    }
    if (!subject || typeof subject !== "string" || !subject.trim()) {
      return next(new AppError("Subject is required and must be a valid string.", 400));
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return next(new AppError("Message content is required and must be a valid string.", 400));
    }

    // Forwarding the query to Winston console logs (representing owner message delivery)
    logger.info(`[Contact Form Submission]
Name: ${name}
Email: ${email}
Subject: ${subject}
Message: ${message}
Owner Email Forward Target: ${config.contactEmail}`);

    res.status(200).json({
      success: true,
      message: "Your message has been successfully received. We will get back to you shortly.",
    });
  });
}
