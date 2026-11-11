export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatParams {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
}

export interface ChatResponse {
  answer: string;
}

export interface ChatStreamParams {
  messages: ChatMessage[];
  temperature?: number;
  model?: string;
  onToken: (token: string) => void;
  signal?: AbortSignal;
}

export interface ExplainCodeParams {
  filePath: string;
  startLine: number;
  endLine: number;
  selectedCode: string;
  mode: "EXPLAIN" | "SUMMARIZE" | "BUG_REVIEW" | "OPTIMIZE" | "SECURITY";
  question?: string;
  chunksText?: string;
  model?: string;
}

export interface ExplainCodeResponse {
  explanation: string;
  referencedFiles: string[];
}

export interface GenerateDiagramParams {
  view: "FOLDER_STRUCTURE" | "DEPENDENCY_GRAPH" | "SERVICE_GRAPH" | "API_FLOW" | "DATABASE_FLOW";
  filePaths: string[];
  packageJsonContent?: string;
  prismaSchemaContent?: string;
  model?: string;
}

export interface GenerateDocumentationParams {
  type: "README" | "API_DOCS" | "FOLDER_STRUCTURE" | "SETUP_GUIDE";
  tone: "PROFESSIONAL" | "BEGINNER" | "ENTERPRISE";
  filePaths: string[];
  packageJsonContent?: string;
  readmeContent?: string;
  model?: string;
}

export interface AnalyzeHealthParams {
  codeContext: string;
  model?: string;
}

export interface AIProvider {
  /**
   * Generates a numeric embedding vector for the given input text.
   *
   * @param text The input text string to generate embeddings for.
   * @returns A promise that resolves to the embedding vector.
   */
  generateEmbedding(text: string): Promise<number[]>;

  /**
   * Generates numeric embedding vectors for multiple input texts in a batch.
   *
   * @param texts An array of input text strings to embed.
   * @returns A promise that resolves to an array of embedding vectors.
   */
  generateEmbeddings(texts: string[]): Promise<number[][]>;

  /**
   * Generates chat responses based on conversation history.
   */
  chat(params: ChatParams): Promise<ChatResponse>;

  /**
   * Streams chat responses token by token.
   */
  chatStream(params: ChatStreamParams): Promise<void>;

  /**
   * Analyzes a selected block of code and returns explanation.
   */
  explainCode(params: ExplainCodeParams): Promise<ExplainCodeResponse>;

  /**
   * Generates a Mermaid.js diagram configuration code mapping the codebase view.
   */
  generateDiagram(params: GenerateDiagramParams): Promise<string>;

  /**
   * Generates project documentation markdown sheets.
   */
  generateDocumentation(params: GenerateDocumentationParams): Promise<string>;

  /**
   * Performs codebase health analysis review.
   */
  analyzeHealth(params: AnalyzeHealthParams): Promise<string>;
}
