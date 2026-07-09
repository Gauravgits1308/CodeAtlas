export interface AIProvider {
  /**
   * Generates a numeric embedding vector for the given input text.
   *
   * @param text The input text string to generate embeddings for.
   * @returns A promise that resolves to the embedding vector.
   */
  generateEmbedding(text: string): Promise<number[]>;
}
