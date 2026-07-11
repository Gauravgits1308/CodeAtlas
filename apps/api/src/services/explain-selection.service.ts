import { RepositoryChatService } from "./repository-chat.service";
import { logger } from "../utils/logger";

export class ExplainSelectionService {
  private chatService: RepositoryChatService;

  constructor(chatService?: RepositoryChatService) {
    this.chatService = chatService || new RepositoryChatService();
  }

  /**
   * Explains a highlighted code block using the existing grounded chat service.
   */
  async explain(params: {
    repositoryId: string;
    filePath: string;
    startLine: number;
    endLine: number;
    selectedCode: string;
    question?: string;
  }) {
    logger.info(`ExplainSelectionService analyzing: ${params.filePath} lines ${params.startLine}-${params.endLine}`);

    // Build the grounding and constraints query
    const prompt =
      `Explain ONLY the following selected code block from the file: "${params.filePath}" (Lines ${params.startLine} to ${params.endLine}).\n` +
      `Do not explain unrelated files.\n\n` +
      `Selected Code:\n\`\`\`\n${params.selectedCode}\n\`\`\`\n\n` +
      `Instruction / Question: ${params.question || "Explain only this selected code block. Assess its overview, purpose, dependencies, possible improvements, potential bugs, and best practices."}`;

    const chatResult = await this.chatService.chat(params.repositoryId, prompt);

    return {
      explanation: chatResult.answer,
      referencedFiles: [params.filePath],
    };
  }
}
