
import { Response } from "express";
import Redis from "ioredis";
import { redisConnection } from "../queue/queue";
import { logger } from "../utils/logger";

const CHANNEL_NAME = "repository:progress";

export class SseService {
  private clients: Map<string, Set<Response>> = new Map();
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;

  private getPubClient(): Redis {
    if (!this.pubClient) {
      this.pubClient = new Redis({
        ...redisConnection,
        maxRetriesPerRequest: undefined,
      });

      this.pubClient.on("error", (err) => {
        logger.error(`Redis Pub Client Error: ${err.message}`, err);
      });

      this.pubClient.on("connect", () => {
        logger.info("Redis publisher connected successfully.");
      });
    }

    return this.pubClient;
  }

  addClient(repositoryId: string, res: Response): void {
    if (!this.clients.has(repositoryId)) {
      this.clients.set(repositoryId, new Set());
    }

    this.clients.get(repositoryId)!.add(res);

    logger.info(
      `[SseService] Client connected for repository ${repositoryId}. Total listeners: ${this.clients.get(repositoryId)!.size
      }`
    );

    res.on("close", () => {
      this.removeClient(repositoryId, res);
    });
  }

  logClients(): void {
    logger.info("Current SSE client connections:");

    for (const [repositoryId, clientsSet] of this.clients.entries()) {
      logger.info(`Repository: ${repositoryId}, listeners: ${clientsSet.size}`);
    }
  }

  removeClient(repositoryId: string, res: Response): void {
    const repoClients = this.clients.get(repositoryId);

    if (!repoClients) return;

    repoClients.delete(res);

    logger.info(
      `[SseService] Client disconnected from repository ${repositoryId}. Remaining listeners: ${repoClients.size}`
    );

    if (repoClients.size === 0) {
      this.clients.delete(repositoryId);
    }
  }

  /**
   * Initializes the Redis subscription listener.
   * This should only execute in the Express API process.
   */
  initSubscriber(): void {
    if (this.subClient) return;

    logger.info("Initializing SseService Redis Subscriber...");

    // Duplicate the connection configuration so the subscriber
    // has its own Redis connection.
    this.subClient = new Redis({
      ...redisConnection,
      maxRetriesPerRequest: undefined,
    });
    this.subClient.on("error", (err) => {
      logger.error(`Redis Sub Client Error: ${err.message}`, err);
    });

    this.subClient.on("connect", () => {
      logger.info("Redis subscriber connected successfully.");
    });

    this.subClient.subscribe(CHANNEL_NAME, (err) => {
      if (err) {
        logger.error(
          `Failed to subscribe to Redis channel ${CHANNEL_NAME}: ${err.message}`,
          err
        );
      } else {
        logger.info(
          `Successfully subscribed to Redis channel: ${CHANNEL_NAME}`
        );
      }
    });

    this.subClient.on("message", (channel, message) => {
      if (channel !== CHANNEL_NAME) return;

      try {
        const payload = JSON.parse(message) as {
          repositoryId?: string;
          data?: unknown;
        };

        const { repositoryId, data } = payload;

        if (!repositoryId || data === undefined || data === null) {
          logger.warn(
            "[SseService] Received Redis message with missing repositoryId or data."
          );
          return;
        }

        const repoClients = this.clients.get(repositoryId);

        if (!repoClients || repoClients.size === 0) {
          logger.debug?.(
            `[SseService] No active SSE clients for repository ${repositoryId}.`
          );
          return;
        }

        const sseMessage = `data: ${JSON.stringify(data)}\n\n`;

        logger.info(
          `[SseService] Broadcasting progress update to ${repoClients.size} listeners for repository ${repositoryId}.`
        );

        for (const client of repoClients) {
          if (client.writableEnded || client.destroyed) {
            repoClients.delete(client);
            continue;
          }

          try {
            client.write(sseMessage);
          } catch (err) {
            const errorMessage =
              err instanceof Error ? err.message : String(err);

            logger.warn(
              `[SseService] Failed to write SSE update for repository ${repositoryId}: ${errorMessage}`
            );

            repoClients.delete(client);
          }
        }

        if (repoClients.size === 0) {
          this.clients.delete(repositoryId);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : String(err);

        logger.error(
          `Failed to parse or broadcast Redis progress message: ${errorMessage}`,
          err
        );
      }
    });
  }

  /**
   * Publishes repository processing progress to Redis.
   * The Express API subscriber forwards it to connected SSE clients.
   */
  async broadcast(repositoryId: string, data: unknown): Promise<void> {
    try {
      const pub = this.getPubClient();
      const payload = JSON.stringify({ repositoryId, data });

      const subscriberCount = await pub.publish(CHANNEL_NAME, payload);

      logger.info(
        `[SseService] Published progress update for repository ${repositoryId}. Redis subscribers: ${subscriberCount}.`
      );
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : String(err);

      logger.error(
        `Failed to publish progress update to Redis: ${errorMessage}`,
        err
      );
    }
  }

  /**
   * Closes Redis connections gracefully.
   */
  async disconnect(): Promise<void> {
    const clients = [this.pubClient, this.subClient];

    this.pubClient = null;
    this.subClient = null;

    await Promise.all(
      clients.map(async (client) => {
        if (client) {
          try {
            await client.quit();
          } catch (err) {
            logger.warn(
              `Error closing Redis connection: ${err instanceof Error ? err.message : String(err)
              }`
            );
          }
        }
      })
    );

    this.clients.clear();
  }
}

export const sseService = new SseService();
