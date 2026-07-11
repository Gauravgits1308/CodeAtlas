import { EmailProvider } from "./EmailProvider";
import { logger } from "../../../utils/logger";

export class LoggerEmailProvider implements EmailProvider {
  async sendEmail(options: {
    to: string;
    from: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    logger.info(`[Email logger-only simulation]
Email dispatch request:
To: ${options.to}
From: ${options.from}
Subject: ${options.subject}
Body:
${options.text}`);
  }
}
