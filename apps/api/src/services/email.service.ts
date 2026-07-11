import { createEmailProvider } from "./email/providers/provider.factory";
import { EmailProvider } from "./email/providers/EmailProvider";
import { config } from "../config";

export class EmailService {
  private provider: EmailProvider;

  constructor(provider?: EmailProvider) {
    this.provider = provider || createEmailProvider();
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
      from: config.emailFrom,
      subject: subjectLine,
      text: textBody,
    });
  }
}
export { EmailProvider };
