import { prisma } from "../database";
import { CodeMetric, Prisma } from "@prisma/client";

export interface CodeMetricInput {
  repositoryId: string;
  linesCount: number;
  filesCount: number;
  languages: unknown;
  complexityScore?: number | null;
  dependencyCount?: number;
  largestFiles: unknown;
  largestDirectories: unknown;
  averageFileSize: number;
  documentationCoverage?: number;
}

export class CodeMetricRepository {
  async createOrUpdate(data: CodeMetricInput): Promise<CodeMetric> {
    return prisma.codeMetric.upsert({
      where: { repositoryId: data.repositoryId },
      update: {
        linesCount: data.linesCount,
        filesCount: data.filesCount,
        languages: data.languages as Prisma.InputJsonValue,
        complexityScore: data.complexityScore ?? null,
        dependencyCount: data.dependencyCount ?? 0,
        largestFiles: data.largestFiles as Prisma.InputJsonValue,
        largestDirectories: data.largestDirectories as Prisma.InputJsonValue,
        averageFileSize: data.averageFileSize,
        documentationCoverage: data.documentationCoverage ?? 0.0,
      },
      create: {
        repositoryId: data.repositoryId,
        linesCount: data.linesCount,
        filesCount: data.filesCount,
        languages: data.languages as Prisma.InputJsonValue,
        complexityScore: data.complexityScore ?? null,
        dependencyCount: data.dependencyCount ?? 0,
        largestFiles: data.largestFiles as Prisma.InputJsonValue,
        largestDirectories: data.largestDirectories as Prisma.InputJsonValue,
        averageFileSize: data.averageFileSize,
        documentationCoverage: data.documentationCoverage ?? 0.0,
      },
    });
  }

  async findByRepositoryId(repositoryId: string): Promise<CodeMetric | null> {
    return prisma.codeMetric.findUnique({
      where: { repositoryId },
    });
  }
}
