import { EmailService } from "./email.service";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";

export class ContactService {
  private emailService: EmailService;

  constructor(emailService?: EmailService) {
    this.emailService = emailService || new EmailService();
  }

  /**
   * Processes, validates, sanitizes and dispatches a contact form submission.
   *
   * @param payload Request parameters from contact submission.
   */
  async processContactSubmission(payload: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<void> {
    const name = this.sanitizeInput(payload.name);
    const email = this.sanitizeInput(payload.email).toLowerCase();
    const subject = this.sanitizeInput(payload.subject);
    const message = this.sanitizeInput(payload.message);

    // Business logic validations
    if (!name) {
      throw new AppError("Name is required.", 400);
    }
    if (!email || !email.includes("@")) {
      throw new AppError("A valid email address is required.", 400);
    }
    if (!subject) {
      throw new AppError("Subject is required.", 400);
    }
    if (!message) {
      throw new AppError("Message content is required.", 400);
    }

    try {
      await this.emailService.sendContactEmail({
        name,
        email,
        subject,
        message,
        time: new Date(),
      });
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`Contact Service delivery execution failed: ${error.message}`, error);
      throw new AppError("Failed to dispatch email request. Please try again later.", 500);
    }
  }

  /**
   * Basic input sanitization stripping HTML tags.
   */
  private sanitizeInput(input: string): string {
    if (!input || typeof input !== "string") return "";
    return input
      .trim()
      .replace(/<[^>]*>/g, ""); // Strip html tags
  }
}
