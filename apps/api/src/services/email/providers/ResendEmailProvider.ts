import { Resend } from "resend";
import { EmailProvider } from "./EmailProvider";
import { config } from "../../../config";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";

export class ResendEmailProvider implements EmailProvider {
  private resendClient: Resend;

  constructor() {
    const apiKey = config.resendApiKey;
    if (!apiKey) {
      throw new AppError("RESEND_API_KEY is not configured.", 500);
    }
    this.resendClient = new Resend(apiKey);
    logger.info("Resend email provider client initialized successfully");
  }

  async sendEmail(options: {
    to: string;
    from: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    try {
      const response = await this.resendClient.emails.send({
        from: options.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send email via Resend.");
      }

      logger.info(`Email successfully dispatched via Resend to ${options.to}. ID: ${response.data?.id}`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Resend API email dispatch failed: ${err.message}`, err);
      throw new AppError(`Resend API dispatch failed: ${err.message}`, 500);
    }
  }
}
