import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";
import { config } from "../config";
import { prisma } from "../database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class DiagramService {
  private openai: OpenAI;

  constructor(openai?: OpenAI) {
    this.openai =
      openai ||
      new OpenAI({
        apiKey: config.openrouterApiKey || "dummy-key",
        baseURL: config.openrouterBaseUrl,
      });
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

    // 4. Select instructions mapping the active view selection
    let viewInstructions = "";
    switch (params.view) {
      case "DEPENDENCY_GRAPH":
        viewInstructions =
          `Generate a dependency graph showing connections between folders or key classes.\n` +
          `Format the output using a Mermaid flowchart directed left-to-right (flowchart LR).\n` +
          `Example:\n` +
          `flowchart LR\n` +
          `  A[service-a] --> B[repository-b]\n` +
          `  B --> C[database]\n`;
        break;

      case "SERVICE_GRAPH":
        viewInstructions =
          `Generate a service call graph mapping Controller routes to Services and Workers.\n` +
          `Format the output using a Mermaid flowchart directed top-to-bottom (flowchart TD).\n` +
          `Show how user requests flow from controllers (e.g. HealthController) to services (e.g. RepositoryHealthService) and any backend worker queues.\n`;
        break;

      case "API_FLOW":
        viewInstructions =
          `Generate an API request flow diagram outlining routing, authentication middlewares, and controllers.\n` +
          `Format the output using a Mermaid flowchart directed left-to-right (flowchart LR).\n` +
          `Ensure to highlight endpoints (e.g. /api/v1/explain-selection) mapping through authentication filters to the controller files.\n`;
        break;

      case "DATABASE_FLOW":
        viewInstructions =
          `Generate an Entity Relationship database schema diagram representing models.\n` +
          `Format the output using a Mermaid flowchart directed top-to-bottom (flowchart TD) or entity relationship syntax (erDiagram).\n` +
          `Map models (User, Repository, CodeChunk, ChunkEmbedding, Conversation, Message) and link their relations clearly.\n`;
        break;

      case "FOLDER_STRUCTURE":
      default:
        viewInstructions =
          `Generate a directory hierarchy structure diagram mapping the folders and files.\n` +
          `Format the output using a Mermaid flowchart directed top-to-bottom (flowchart TD).\n` +
          `Create box directories and leaf nodes representing files. Keep it compact, highlighting major architectural sub-folders (like apps/api, apps/web, components, services).\n`;
    }

    // 5. Build prompt prompts
    const systemPrompt =
      `You are an expert principal software architect.\n` +
      `Your goal is to parse the files layout and project configurations and generate a valid Mermaid.js diagram configuration code mapping the requested codebase architecture view.\n` +
      `${viewInstructions}\n` +
      `CRITICAL RULES:\n` +
      `- Output ONLY the raw Mermaid diagram string (starting with e.g. "flowchart TD" or "erDiagram"). Do not wrap it in markdown code blocks like \`\`\`mermaid. Do not write introductory or concluding conversational lines.\n` +
      `- Avoid syntax compilation errors. Avoid using illegal characters (like parentheses, slashes, dashes, brackets, colons) inside node IDs directly. If a node label contains special characters, use the syntax: NodeID["Label Text"] (e.g., app_controller["app.controller.ts"] or auth_service["auth.service.ts"]).\n` +
      `- Make node IDs represent file paths or classes so that they are unique, clean, and match source labels.\n`;

    const userPrompt =
      `Codebase file path list:\n${filePaths.join("\n")}\n\n` +
      (packageJsonContent ? `Dependencies configuration (package.json):\n\`\`\`json\n${packageJsonContent}\n\`\`\`\n\n` : "") +
      (prismaSchemaContent ? `Database schema models (schema.prisma):\n\`\`\`prisma\n${prismaSchemaContent}\n\`\`\`\n\n` : "") +
      `Generate the raw Mermaid code mapping view: "${params.view}" now.`;

    if (!config.openrouterApiKey) {
      throw new AppError("OPENROUTER_API_KEY is not configured.", 500);
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: config.openrouterChatModel || "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      });

      let rawMermaid = response.choices[0]?.message?.content || "";
      
      // Clean up any markdown code block wrappers if the LLM outputted them despite instructions
      rawMermaid = rawMermaid.replace(/^```mermaid\s*/i, "");
      rawMermaid = rawMermaid.replace(/^```\s*/, "");
      rawMermaid = rawMermaid.replace(/```\s*$/, "");
      rawMermaid = rawMermaid.trim();

      // Write cache to filesystem
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      fs.writeFileSync(cacheFile, rawMermaid, "utf-8");

      return rawMermaid;
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`OpenRouter diagram generation failure: ${error.message}`);
      throw new AppError(`Diagram generation failed: ${error.message}`, 500);
    }
  }
}
