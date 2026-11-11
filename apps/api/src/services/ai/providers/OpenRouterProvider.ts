import OpenAI from "openai";
import { config } from "../../../config";
import {
  AIProvider,
  ChatParams,
  ChatResponse,
  ChatStreamParams,
  ExplainCodeParams,
  ExplainCodeResponse,
  GenerateDiagramParams,
  GenerateDocumentationParams,
  AnalyzeHealthParams
} from "./AIProvider";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 1) {
      throw error;
    }
    logger.warn(`API call failed, retrying in ${delay}ms... Error: ${(error as Error).message}`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

export class OpenRouterProvider implements AIProvider {
  private openai: OpenAI;

  constructor() {
    const apiKey = config.openrouterApiKey;
    const baseURL = config.openrouterBaseUrl;

    if (!baseURL) {
      throw new AppError("OPENROUTER_BASE_URL is not configured.", 500);
    }

    logger.info(`Initializing OpenRouterProvider with baseURL: ${baseURL}`);

    this.openai = new OpenAI({
      apiKey: apiKey || "dummy-key",
      baseURL: baseURL,
    });
  }

  /**
   * Generates embedding via OpenRouter API with retries.
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.", 500);
    }

    if (!config.openrouterEmbeddingModel) {
      throw new AppError("OPENROUTER_EMBEDDING_MODEL is not configured.", 500);
    }

    const model = config.openrouterEmbeddingModel;
    const trimmedText = text.trim();

    return retryWithBackoff(async () => {
      logger.info(`Sending embedding API request to OpenRouter model: ${model}`);
      const response = await this.openai.embeddings.create({
        model,
        input: trimmedText,
      });

      const embedding = response.data?.[0]?.embedding;
      if (!embedding || !Array.isArray(embedding)) {
        throw new AppError("Invalid response format received from OpenRouter API.", 500);
      }

      logger.info("OpenRouter API embedding response successfully received");
      return embedding;
    });
  }

  /**
   * Generates embeddings for multiple texts in a batch with retries.
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.", 500);
    }

    if (!config.openrouterEmbeddingModel) {
      throw new AppError("OPENROUTER_EMBEDDING_MODEL is not configured.", 500);
    }

    if (texts.length === 0) {
      return [];
    }

    const model = config.openrouterEmbeddingModel;
    const trimmedTexts = texts.map(t => t.trim()).filter(Boolean);

    if (trimmedTexts.length === 0) {
      return [];
    }

    return retryWithBackoff(async () => {
      logger.info(`Sending batch embedding API request (size: ${trimmedTexts.length}) to OpenRouter model: ${model}`);
      const response = await this.openai.embeddings.create({
        model,
        input: trimmedTexts,
      });

      const embeddings = response.data?.map(item => item.embedding);
      if (!embeddings || embeddings.length !== trimmedTexts.length) {
        throw new AppError("Invalid response format or count mismatch received from OpenRouter API batch request.", 500);
      }

      logger.info(`OpenRouter API batch embedding response successfully received (size: ${embeddings.length})`);
      return embeddings;
    });
  }

  /**
   * Generates chat responses based on conversation history.
   */
  async chat(params: ChatParams): Promise<ChatResponse> {
    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.", 500);
    }
    const model = params.model || config.openrouterChatModel || "google/gemini-2.5-flash-lite";
    const temperature = params.temperature !== undefined ? params.temperature : 0.15;

    return retryWithBackoff(async () => {
      logger.info(`Sending chat completion API request to OpenRouter model: ${model}`);
      const response = await this.openai.chat.completions.create({
        model,
        messages: params.messages,
        temperature,
      });
      const answer = response.choices[0]?.message?.content || "";
      return { answer };
    });
  }

  /**
   * Streams chat responses token by token.
   */
  async chatStream(params: ChatStreamParams): Promise<void> {
    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.", 500);
    }
    const model = params.model || config.openrouterChatModel || "google/gemini-2.5-flash-lite";
    const temperature = params.temperature !== undefined ? params.temperature : 0.15;

    logger.info(`Sending streaming chat completion API request to OpenRouter model: ${model}`);
    const stream = await this.openai.chat.completions.create({
      model,
      messages: params.messages,
      temperature,
      stream: true,
    });

    for await (const chunk of stream) {
      if (params.signal?.aborted) {
        logger.info("chatStream aborted by AbortSignal");
        break;
      }
      const token = chunk.choices[0]?.delta?.content || "";
      if (token) {
        params.onToken(token);
      }
    }
  }

  /**
   * Analyzes a selected block of code and returns explanation.
   */
  async explainCode(params: ExplainCodeParams): Promise<ExplainCodeResponse> {
    if (!config.openrouterApiKey) {
      throw new AppError("OpenRouter API key is missing. Please configure OPENROUTER_API_KEY.", 500);
    }

    let systemPrompt = "";
    switch (params.mode) {
      case "SUMMARIZE":
        systemPrompt =
          `You are an expert AI code reviewer. Your purpose is to provide a concise summary of the selected code.\n` +
          `You MUST format your analysis report using these exact Markdown headers:\n\n` +
          `## Overview\n` +
          `...\n` +
          `## Responsibilities\n` +
          `...\n` +
          `## Inputs\n` +
          `...\n` +
          `## Outputs\n` +
          `...\n` +
          `## Key Logic\n` +
          `...\n`;
        break;

      case "BUG_REVIEW":
        systemPrompt =
          `You are an expert AI code debugger. Review ONLY the selected code block for bugs, null reference risks, edge cases, infinite loops, missing validation, dead code, incorrect async handling, or potential runtime crashes.\n` +
          `You MUST format your analysis report using these exact Markdown headers:\n\n` +
          `## Critical Issues\n` +
          `...\n` +
          `## Medium Issues\n` +
          `...\n` +
          `## Low Issues\n` +
          `...\n` +
          `## Suggested Fixes\n` +
          `...\n`;
        break;

      case "OPTIMIZE":
        systemPrompt =
          `You are an expert AI performance engineer. Suggest performance and maintainability improvements. Analyze time complexity, memory usage, repeated logic, code duplication, readability, modern language features, SOLID, and DRY.\n` +
          `You MUST format your analysis report using these exact Markdown headers:\n\n` +
          `## Current Implementation\n` +
          `...\n` +
          `## Optimization Opportunities\n` +
          `...\n` +
          `## Refactored Example\n` +
          `...\n` +
          `## Estimated Benefit\n` +
          `...\n`;
        break;

      case "SECURITY":
        systemPrompt =
          `You are an expert AI security auditor. Analyze the selected code for security issues (SQL Injection, XSS, Command Injection, Unsafe File Access, Secrets leaks, Authentication Problems, Authorization Problems, Input Validation, Dependency Risks).\n` +
          `You MUST format your analysis report using these exact Markdown headers:\n\n` +
          `## Risk Level\n` +
          `...\n` +
          `## Findings\n` +
          `...\n` +
          `## Recommendations\n` +
          `...\n` +
          `## Example Fixes\n` +
          `...\n`;
        break;

      case "EXPLAIN":
      default:
        systemPrompt =
          `You are an expert AI software engineer. Explain the selected code in depth.\n` +
          `You MUST format your analysis report using these exact Markdown headers:\n\n` +
          `## 📌 Purpose\n` +
          `...\n` +
          `## ⚙️ How It Works\n` +
          `...\n` +
          `## 🔗 Dependencies\n` +
          `...\n` +
          `## 💡 Why It Exists\n` +
          `...\n` +
          `## 📖 Example Flow\n` +
          `...\n`;
    }

    const userPrompt =
      `Selected Code from File: "${params.filePath}" (lines ${params.startLine}-${params.endLine})\n` +
      `Code Snippet:\n\`\`\`\n${params.selectedCode}\n\`\`\`\n\n` +
      `Repository Context:\n${params.chunksText || "No context available."}\n\n` +
      (params.question ? `Follow-up query: ${params.question}` : "Analyze the selected code.");

    const model = params.model || config.openrouterChatModel || "google/gemini-2.5-flash-lite";

    return retryWithBackoff(async () => {
      logger.info(`Sending code explanation API request to OpenRouter model: ${model}`);
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.15,
      });

      const explanation = response.choices[0]?.message?.content || "No analysis generated.";
      return {
        explanation,
        referencedFiles: [params.filePath],
      };
    });
  }

  /**
   * Generates a Mermaid.js diagram configuration code mapping the codebase view.
   */
  async generateDiagram(params: GenerateDiagramParams): Promise<string> {
    if (!config.openrouterApiKey) {
      throw new AppError("OPENROUTER_API_KEY is not configured.", 500);
    }

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

    const systemPrompt =
      `You are an expert principal software architect.\n` +
      `Your goal is to parse the files layout and project configurations and generate a valid Mermaid.js diagram configuration code mapping the requested codebase architecture view.\n` +
      `${viewInstructions}\n` +
      `CRITICAL RULES:\n` +
      `- Output ONLY the raw Mermaid diagram string (starting with e.g. "flowchart TD" or "erDiagram"). Do not wrap it in markdown code blocks like \`\`\`mermaid. Do not write introductory or concluding conversational lines.\n` +
      `- Avoid syntax compilation errors. Avoid using illegal characters (like parentheses, slashes, dashes, brackets, colons) inside node IDs directly. If a node label contains special characters, use the syntax: NodeID["Label Text"] (e.g., app_controller["app.controller.ts"] or auth_service["auth.service.ts"]).\n` +
      `- Make node IDs represent file paths or classes so that they are unique, clean, and match source labels.\n`;

    const userPrompt =
      `Codebase file path list:\n${params.filePaths.join("\n")}\n\n` +
      (params.packageJsonContent ? `Dependencies configuration (package.json):\n\`\`\`json\n${params.packageJsonContent}\n\`\`\`\n\n` : "") +
      (params.prismaSchemaContent ? `Database schema models (schema.prisma):\n\`\`\`prisma\n${params.prismaSchemaContent}\n\`\`\`\n\n` : "") +
      `Generate the raw Mermaid code mapping view: "${params.view}" now.`;

    const model = params.model || config.openrouterChatModel || "google/gemini-2.5-flash-lite";

    return retryWithBackoff(async () => {
      logger.info(`Sending diagram generation API request to OpenRouter model: ${model}`);
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
      });

      let rawMermaid = response.choices[0]?.message?.content || "";
      rawMermaid = rawMermaid.replace(/^```mermaid\s*/i, "");
      rawMermaid = rawMermaid.replace(/^```\s*/, "");
      rawMermaid = rawMermaid.replace(/```\s*$/, "");
      rawMermaid = rawMermaid.trim();

      return rawMermaid;
    });
  }

  /**
   * Generates project documentation markdown sheets.
   */
  async generateDocumentation(params: GenerateDocumentationParams): Promise<string> {
    if (!config.openrouterApiKey) {
      throw new AppError("OPENROUTER_API_KEY is not configured.", 500);
    }

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

    const systemPrompt =
      `You are an expert technical writer and principal architect.\n` +
      `Your goal is to output a single, complete, documentation sheet in markdown based on the project files list and configurations provided.\n` +
      `${docTypeInstructions}\n` +
      `${toneGuidelines}\n` +
      `Do not include any chat prefix or suffix. Output only the raw markdown documentation content.`;

    const userPrompt =
      `Project files list:\n${params.filePaths.join("\n")}\n\n` +
      (params.packageJsonContent ? `Project package.json configuration:\n\`\`\`json\n${params.packageJsonContent}\n\`\`\`\n\n` : "") +
      (params.readmeContent ? `Project existing README.md metadata:\n\`\`\`markdown\n${params.readmeContent}\n\`\`\`\n\n` : "") +
      `Generate the requested documentation now.`;

    const model = params.model || config.openrouterChatModel || "google/gemini-2.5-flash-lite";

    return retryWithBackoff(async () => {
      logger.info(`Sending documentation API request to OpenRouter model: ${model}`);
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.15,
      });

      return response.choices[0]?.message?.content || "Failed to generate documentation.";
    });
  }

  /**
   * Performs codebase health analysis review.
   */
  async analyzeHealth(params: AnalyzeHealthParams): Promise<string> {
    if (!config.openrouterApiKey) {
      throw new AppError("OPENROUTER_API_KEY is not configured.", 500);
    }
    const model = params.model || config.openrouterChatModel || "google/gemini-2.5-flash-lite";

    const systemPrompt = "You are a senior software architect specializing in codebase health and quality metrics.";
    const userPrompt =
      "Perform a detailed code review and code-quality health analysis of this repository codebase.\n" +
      "Assess architecture, maintainability, readability, security, performance, documentation, testing, and scalability.\n" +
      "Under ## Quality Metrics, list all category scores out of 10. Under ## Engineering Analysis, list Strengths and Weaknesses.\n" +
      "Under ## Recommendations, list Top Recommendations, Quick Wins, and Long-Term Improvements.\n\n" +
      `Codebase context:\n${params.codeContext}`;

    return retryWithBackoff(async () => {
      logger.info(`Sending codebase health analysis API request to OpenRouter model: ${model}`);
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.15,
      });
      return response.choices[0]?.message?.content || "Failed to analyze health.";
    });
  }
}
