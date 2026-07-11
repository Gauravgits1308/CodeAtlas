import nodemailer from "nodemailer";
import { config } from "../config";
import { logger } from "../utils/logger";

export interface EmailProvider {
  sendEmail(options: {
    to: string;
    from: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void>;
}

export class NodemailerEmailProvider implements EmailProvider {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const { smtpHost, smtpPort, smtpUser, smtpPass, smtpSecure } = config;

    // Only configure transporter if host/user/pass parameters are provided
    if (smtpHost && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      logger.info(`Nodemailer transporter initialized on ${smtpHost}:${smtpPort}`);
    } else {
      logger.warn(
        "SMTP settings are missing. NodemailerEmailProvider will default to logger-only fallback mode."
      );
    }
  }

  async sendEmail(options: {
    to: string;
    from: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void> {
    if (this.transporter) {
      await this.transporter.sendMail({
        from: options.from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      logger.info(`Email successfully dispatched via SMTP to ${options.to}`);
    } else {
      logger.info(`[SMTP logger-only simulation]
Email dispatch request:
To: ${options.to}
From: ${options.from}
Subject: ${options.subject}
Body:
${options.text}`);
    }
  }
}

export class EmailService {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    this.provider = provider || new NodemailerEmailProvider();
  }

  /**
   * Dispatches contact submissions to the owner's configured inbox.
   */
  async sendContactEmail(submission: {
    name: string;
    email: string;
    subject: string;
    message: string;
    time: Date;
  }): Promise<void> {
    const subjectLine = `Contact Form Submission - CodeAtlas`;
    const textBody = `
Contact Form Submission - CodeAtlas
----------------------------------
Name: ${submission.name}
Email: ${submission.email}
Subject: ${submission.subject}
Message: ${submission.message}

Submission Time: ${submission.time.toISOString()}
    `;

    await this.provider.sendEmail({
      to: config.contactEmail,
      from: `"${submission.name}" <${config.smtpUser || submission.email}>`,
      subject: subjectLine,
      text: textBody,
    });
  }
}
