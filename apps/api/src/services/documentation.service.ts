import OpenAI from "openai";
import { config } from "../config";
import { prisma } from "../database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class DocumentationService {
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

    // 3. Select system instructions and required structure based on documentation type
    let docTypeInstructions = "";
    switch (params.type) {
      case "API_DOCS":
        docTypeInstructions =
          `Generate comprehensive API documentation for the project.\n` +
          `You MUST format the documentation using these Markdown headers:\n` +
          `# API Documentation\n` +
          `## Overview\n` +
          `## Endpoint Mappings\n` +
          `## Request & Response Payloads\n` +
          `## Request Parameter Mappings\n` +
          `## Authentication & Authorization\n`;
        break;

      case "FOLDER_STRUCTURE":
        docTypeInstructions =
          `Generate a Folder Structure mapping guide.\n` +
          `You MUST format the documentation using these Markdown headers:\n` +
          `# Folder Structure Documentation\n` +
          `## Overview\n` +
          `## Directory Layout Tree\n` +
          `## Module Responsibilities\n` +
          `## Coding Guidelines & Standards\n`;
        break;

      case "SETUP_GUIDE":
        docTypeInstructions =
          `Generate a Setup and Installation guide.\n` +
          `You MUST format the documentation using these Markdown headers:\n` +
          `# Setup & Installation Guide\n` +
          `## Prerequisites\n` +
          `## Installation Steps\n` +
          `## Environment Variable Configurations\n` +
          `## Database Configuration & Migrations\n` +
          `## Running Dev and Production Environments\n`;
        break;

      case "README":
      default:
        docTypeInstructions =
          `Generate a comprehensive project README.md file.\n` +
          `You MUST format the documentation using these exact Markdown headers:\n` +
          `# Project Overview\n` +
          `## Installation\n` +
          `## Architecture\n` +
          `## Folder Structure\n` +
          `## Usage\n` +
          `## Features\n` +
          `## API\n` +
          `## Deployment\n` +
          `## License\n`;
    }

    // 4. Adapt tone style guidelines
    let toneGuidelines = "";
    switch (params.tone) {
      case "BEGINNER":
        toneGuidelines =
          `Adopt a friendly, step-by-step, beginner-focused tutorial tone. Avoid complex jargon or explain it if used. Explain concepts, pre-requisites, and commands explicitly.`;
        break;
      case "ENTERPRISE":
        toneGuidelines =
          `Adopt a highly structured, enterprise-ready tone. Highlight compliance protocols, scalability factors, security features, environment profiles, audits, production SLAs, and configurations.`;
        break;
      case "PROFESSIONAL":
      default:
        toneGuidelines =
          `Adopt a standard professional software engineer documentation tone. Focus on clean layout, technical clarity, efficiency, and structural accuracy.`;
    }

    // 5. Construct full prompt
    const systemPrompt =
      `You are an expert technical writer and principal architect.\n` +
      `Your goal is to output a single, complete, production-quality markdown documentation sheet based on the project files list and configurations provided.\n` +
      `${docTypeInstructions}\n` +
      `${toneGuidelines}\n` +
      `Do not include any chat prefix or suffix. Output only the raw markdown documentation content.`;

    const userPrompt =
      `Project files list:\n${filePaths.join("\n")}\n\n` +
      (packageJsonContent ? `Project package.json configuration:\n\`\`\`json\n${packageJsonContent}\n\`\`\`\n\n` : "") +
      (readmeContent ? `Project existing README.md metadata:\n\`\`\`markdown\n${readmeContent}\n\`\`\`\n\n` : "") +
      `Generate the requested documentation now.`;

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
        temperature: 0.15,
      });

      return response.choices[0]?.message?.content || "Failed to generate documentation.";
    } catch (err: unknown) {
      const error = err as Error;
      logger.error(`OpenRouter docs generation failure: ${error.message}`);
      throw new AppError(`Documentation generation failed: ${error.message}`, 500);
    }
  }
}
