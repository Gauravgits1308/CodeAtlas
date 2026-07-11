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
}
