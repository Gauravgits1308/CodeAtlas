-- Enable pgvector for embedding storage
CREATE EXTENSION IF NOT EXISTS vector;

-- Add the missing repository status
ALTER TYPE "RepositoryStatus" ADD VALUE 'PARTIALLY_INDEXED';

-- Bring existing Repository columns in line with Prisma schema
ALTER TABLE "Repository"
ADD COLUMN "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "chunksCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "embeddingsCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "defaultBranch" SET DEFAULT 'main';

-- Add missing CodeChunk classification
ALTER TABLE "CodeChunk"
ADD COLUMN "classification" TEXT;

-- Add the pgvector embedding column
ALTER TABLE "ChunkEmbedding"
ADD COLUMN "embedding" vector;

-- Create Conversation
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- Create Message
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- Create RepositoryProcessingStatus
CREATE TABLE "RepositoryProcessingStatus" (
    "id" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "currentStage" TEXT NOT NULL DEFAULT 'QUEUED',
    "stageProgress" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "startedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "currentMessage" TEXT,
    "errorMessage" TEXT,
    "estimatedRemainingTime" TEXT,
    "processedFiles" INTEGER NOT NULL DEFAULT 0,
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "processedChunks" INTEGER NOT NULL DEFAULT 0,
    "totalChunks" INTEGER NOT NULL DEFAULT 0,
    "embeddingsGenerated" INTEGER NOT NULL DEFAULT 0,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedStages" JSONB,
    "failedStage" TEXT,
    "logs" JSONB,
    CONSTRAINT "RepositoryProcessingStatus_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "Conversation_repositoryId_idx"
ON "Conversation"("repositoryId");

CREATE INDEX "Conversation_userId_idx"
ON "Conversation"("userId");

CREATE INDEX "Message_conversationId_idx"
ON "Message"("conversationId");

CREATE UNIQUE INDEX "RepositoryProcessingStatus_repositoryId_key"
ON "RepositoryProcessingStatus"("repositoryId");

-- Create foreign keys
ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_repositoryId_fkey"
FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Conversation"
ADD CONSTRAINT "Conversation_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Message"
ADD CONSTRAINT "Message_conversationId_fkey"
FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RepositoryProcessingStatus"
ADD CONSTRAINT "RepositoryProcessingStatus_repositoryId_fkey"
FOREIGN KEY ("repositoryId") REFERENCES "Repository"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
