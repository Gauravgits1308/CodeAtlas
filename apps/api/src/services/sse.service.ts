import { Response } from "express";
import { logger } from "../utils/logger";

export class SseService {
  private clients: Map<string, Set<Response>> = new Map();

  /**
   * Registers a client response stream for the target repository progress updates.
   */
  addClient(repositoryId: string, res: Response) {
    if (!this.clients.has(repositoryId)) {
      this.clients.set(repositoryId, new Set());
    }
    this.clients.get(repositoryId)!.add(res);
    logger.info(`SSE client connected for repo: ${repositoryId}. Total listener clients: ${this.clients.get(repositoryId)!.size}`);
  }

  /**
   * Deregisters a client response stream.
   */
  removeClient(repositoryId: string, res: Response) {
    const repoClients = this.clients.get(repositoryId);
    if (repoClients) {
      repoClients.delete(res);
      logger.info(`SSE client disconnected for repo: ${repositoryId}. Remaining listeners: ${repoClients.size}`);
      if (repoClients.size === 0) {
        this.clients.delete(repositoryId);
      }
    }
  }

  /**
   * Broadcasts a real-time progress update to all listening clients.
   */
  broadcast(repositoryId: string, data: unknown) {
    const repoClients = this.clients.get(repositoryId);
    if (!repoClients || repoClients.size === 0) return;

    logger.debug(`SSE broadcasting progress payload to ${repoClients.size} listeners for repo: ${repositoryId}`);
    const message = `data: ${JSON.stringify(data)}\n\n`;

    repoClients.forEach((client) => {
      try {
        client.write(message);
      } catch {
        logger.warn(`Failed to write to SSE client for repo: ${repositoryId}, connection might be closed.`);
      }
    });
  }
}

export const sseService = new SseService();
