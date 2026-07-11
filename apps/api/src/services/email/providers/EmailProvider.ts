export interface EmailProvider {
  sendEmail(options: {
    to: string;
    from: string;
    subject: string;
    text: string;
    html?: string;
  }): Promise<void>;
}
