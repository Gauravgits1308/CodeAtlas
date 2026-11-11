import { prisma } from "../database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { AIProvider } from "./ai/providers/AIProvider";
import { createAIProvider } from "./ai/providers/provider.factory";

export class DocumentationService {
  private aiProvider: AIProvider;

  constructor(aiProvider?: AIProvider) {
    this.aiProvider = aiProvider || createAIProvider();
  }

  /**
   * Generates project documentation based on repository indexed file list and configuration details.
   */
  async generateDocumentation(params: {
    repositoryId: string;
    type: "README" | "API_DOCS" | "FOLDER_STRUCTURE" | "SETUP_GUIDE";
    tone: "PROFESSIONAL" | "BEGINNER" | "ENTERPRISE";
  }): Promise<string> {
    logger.info(
      `DocumentationService generating: Repo=${params.repositoryId}, Type=${params.type}, Tone=${params.tone}`
    );

    // 1. Fetch file list and code chunks from database to populate folder structure mappings
    const chunks = await prisma.codeChunk.findMany({
      where: { repositoryId: params.repositoryId },
      select: { filePath: true },
    });

    const filePaths = Array.from(new Set(chunks.map((c) => c.filePath))).sort();

    if (filePaths.length === 0) {
      throw new AppError(
        "Repository has no indexed code chunks. Please complete repository processing first.",
        400
      );
    }

    // 2. Fetch key configuration file contents for context (e.g. package.json or README.md)
    let packageJsonContent = "";
    let readmeContent = "";
    try {
      const packageChunk = await prisma.codeChunk.findFirst({
        where: {
          repositoryId: params.repositoryId,
          filePath: { endsWith: "package.json" },
        },
      });
      if (packageChunk) packageJsonContent = packageChunk.content;

      const readmeChunk = await prisma.codeChunk.findFirst({
        where: {
          repositoryId: params.repositoryId,
          filePath: { endsWith: "README.md" },
        },
      });
      if (readmeChunk) readmeContent = readmeChunk.content;
    } catch (err) {
      logger.warn(`Failed to fetch package.json / README.md chunks for context: ${err}`);
    }

    // 3. Delegate to AI Provider to generate documentation
    return this.aiProvider.generateDocumentation({
      type: params.type,
      tone: params.tone,
      filePaths,
      packageJsonContent,
      readmeContent,
    });
  }
}
