import { EmailProvider } from "./EmailProvider";
import { ResendEmailProvider } from "./ResendEmailProvider";
import { LoggerEmailProvider } from "./LoggerEmailProvider";
import { config } from "../../../config";

/**
 * Strategy factory resolving the concrete EmailProvider.
 * If RESEND_API_KEY environment variable is configured, it instantiates ResendEmailProvider.
 * Otherwise, it defaults back to simulated LoggerEmailProvider.
 */
export function createEmailProvider(): EmailProvider {
  if (config.resendApiKey) {
    return new ResendEmailProvider();
  }
  return new LoggerEmailProvider();
}
