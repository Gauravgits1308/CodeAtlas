import OpenAI from "openai";
import { config } from "../config";
import { prisma } from "../database";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";

export class RepositoryConversationService {
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
   * Creates a new conversation thread.
   */
  async createConversation(userId: string, repositoryId: string, title: string) {
    logger.info(`Conversation Created for user: ${userId}, repo: ${repositoryId}, title: "${title}"`);
    return prisma.conversation.create({
      data: {
        userId,
        repositoryId,
        title,
      },
    });
  }

  /**
   * Lists all conversation threads for a repository.
   */
  async listConversations(userId: string, repositoryId: string) {
    return prisma.conversation.findMany({
      where: {
        userId,
        repositoryId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });
  }

  /**
   * Renames a conversation title.
   */
  async renameConversation(userId: string, conversationId: string, title: string) {
    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!convo || convo.userId !== userId) {
      throw new AppError("Conversation not found or access denied.", 404);
    }

    return prisma.conversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Deletes a conversation thread.
   */
  async deleteConversation(userId: string, conversationId: string) {
    const convo = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!convo || convo.userId !== userId) {
      throw new AppError("Conversation not found or access denied.", 404);
    }

    await prisma.conversation.delete({
      where: { id: conversationId },
    });
    logger.info(`Conversation ${conversationId} deleted by user ${userId}`);
  }

  /**
   * Adds a message to the conversation thread.
   */
  async addMessage(conversationId: string, role: "user" | "assistant", content: string, sources?: unknown) {
    logger.info(`Messages Added to conversation ${conversationId}: ${role}`);
    
    // Add message
    const msg = await prisma.message.create({
      data: {
        conversationId,
        role,
        content,
        sources: sources ? JSON.parse(JSON.stringify(sources)) : undefined,
      },
    });

    // Touch conversation updated timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return msg;
  }

  /**
   * Retrieves conversation messages history context with sliding window summarization.
   */
  async getHistoryContext(conversationId: string, limit = 6): Promise<{ context: string; summaryTriggered: boolean }> {
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });

    if (messages.length <= limit) {
      const historyText = messages
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");
      
      const charCount = historyText.length;
      logger.info(`Memory Tokens char size: ${charCount}`);
      return { context: historyText, summaryTriggered: false };
    }

    // Older messages get summarized, and recent messages are appended directly (sliding window)
    const olderMessages = messages.slice(0, messages.length - limit);
    const recentMessages = messages.slice(messages.length - limit);

    logger.info(`Summarization Triggered for conversation ${conversationId}. Summarizing ${olderMessages.length} older messages.`);

    const olderHistoryText = olderMessages
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n");

    const summary = await this.summarizeHistory(olderHistoryText);

    const historyText =
      `Summary of previous conversation:\n${summary}\n\n` +
      recentMessages
        .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
        .join("\n");

    const charCount = historyText.length;
    logger.info(`Memory Tokens char size after summary: ${charCount}`);

    return { context: historyText, summaryTriggered: true };
  }

  /**
   * Call LLM to compress dialogue context into summary sentence loops.
   */
  private async summarizeHistory(historyText: string): Promise<string> {
    try {
      const response = await this.openai.chat.completions.create({
        model: config.openrouterChatModel,
        messages: [
          {
            role: "system",
            content: "You are an AI assistant. Summarize the following dialogue history between a User and an Assistant in 2-3 concise sentences.",
          },
          { role: "user", content: historyText },
        ],
        temperature: 0.2,
      });
      return response.choices[0]?.message?.content || "Dialogue summary unavailable.";
    } catch (err) {
      logger.error("Failed to summarize dialogue history:", err);
      return "Dialogue summary unavailable.";
    }
  }
}
