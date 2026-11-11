import * as fs from "fs";
import * as path from "path";
import { prisma } from "../database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";
import { AIProvider } from "./ai/providers/AIProvider";
import { createAIProvider } from "./ai/providers/provider.factory";

export class DiagramService {
  private aiProvider: AIProvider;

  constructor(aiProvider?: AIProvider) {
    this.aiProvider = aiProvider || createAIProvider();
  }

  /**
   * Generates or retrieves cached Mermaid.js diagram strings for the target codebase layout view.
   */
  async getDiagram(params: {
    repositoryId: string;
    view: "FOLDER_STRUCTURE" | "DEPENDENCY_GRAPH" | "SERVICE_GRAPH" | "API_FLOW" | "DATABASE_FLOW";
    forceRefresh?: boolean;
  }): Promise<string> {
    const cacheDir = path.join(process.cwd(), "storage", "repositories", params.repositoryId, "diagrams");
    const cacheFile = path.join(cacheDir, `${params.view.toLowerCase()}.mermaid`);

    // 1. Return from cache if valid and not force refreshing
    if (!params.forceRefresh && fs.existsSync(cacheFile)) {
      try {
        const cached = fs.readFileSync(cacheFile, "utf-8");
        logger.info(`Loaded cached diagram for repo: ${params.repositoryId}, view: ${params.view}`);
        return cached;
      } catch {
        logger.warn(`Failed to read cached diagram for repo: ${params.repositoryId}, regenerating.`);
      }
    }

    logger.info(`Generating fresh diagram: Repo=${params.repositoryId}, View=${params.view}`);

    // 2. Fetch all indexed files inside repository
    const chunks = await prisma.codeChunk.findMany({
      where: { repositoryId: params.repositoryId },
      select: { filePath: true },
    });
    const filePaths = Array.from(new Set(chunks.map((c) => c.filePath))).sort();

    if (filePaths.length === 0) {
      throw new AppError(
        "Repository has no indexed code chunks. Diagrams require completed repository synchronization.",
        400
      );
    }

    // 3. Extract relevant helper file contexts to feed the LLM
    let packageJsonContent = "";
    let prismaSchemaContent = "";
    try {
      const packageChunk = await prisma.codeChunk.findFirst({
        where: {
          repositoryId: params.repositoryId,
          filePath: { endsWith: "package.json" },
        },
      });
      if (packageChunk) packageJsonContent = packageChunk.content;

      const schemaChunk = await prisma.codeChunk.findFirst({
        where: {
          repositoryId: params.repositoryId,
          filePath: { endsWith: "schema.prisma" },
        },
      });
      if (schemaChunk) prismaSchemaContent = schemaChunk.content;
    } catch (err) {
      logger.warn(`Failed to fetch context files for diagram rendering: ${err}`);
    }

    // 4. Delegate Mermaid diagram generation to AI Provider
    const rawMermaid = await this.aiProvider.generateDiagram({
      view: params.view,
      filePaths,
      packageJsonContent,
      prismaSchemaContent,
    });

    // 5. Write cache to filesystem
    try {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(cacheFile, rawMermaid, "utf-8");
    } catch (err) {
      logger.error(`Failed to cache diagram to disk: ${err}`);
    }

    return rawMermaid;
  }
}
