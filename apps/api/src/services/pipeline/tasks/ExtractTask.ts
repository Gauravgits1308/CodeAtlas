import { PipelineTask, PipelineContext } from "../Task";
import { promises as fs } from "fs";
import * as path from "path";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";
import { FileClassification } from "../../file-extraction.service";

const SOURCE_CODE_EXTS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go", ".rs",
  ".cpp", ".c", ".cs", ".php", ".rb", ".mjs", ".cjs", ".sql"
]);
const MARKUP_EXTS = new Set([".html"]);
const STYLESHEET_EXTS = new Set([".css", ".scss", ".sass", ".less"]);
const CONFIGURATION_EXTS = new Set([".json", ".yml", ".yaml", ".toml", ".xml", ".graphql", ".gql"]);
const CONFIGURATION_FILES = new Set([".env.example"]);
const DOCUMENTATION_EXTS = new Set([".md", ".mdx"]);
const IGNORED_FILENAMES = new Set([".env", ".env.local", ".env.production", ".env.development"]);
const IGNORE_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", "out", "vendor"]);

// 2MB max file size limit to prevent Node heap OOM crashes
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

function classifyFile(fileName: string): FileClassification | null {
  if (IGNORED_FILENAMES.has(fileName)) return null;
  if (CONFIGURATION_FILES.has(fileName)) return "CONFIGURATION";

  const ext = path.extname(fileName).toLowerCase();
  if (SOURCE_CODE_EXTS.has(ext)) return "SOURCE_CODE";
  if (MARKUP_EXTS.has(ext)) return "MARKUP";
  if (STYLESHEET_EXTS.has(ext)) return "STYLESHEET";
  if (CONFIGURATION_EXTS.has(ext)) return "CONFIGURATION";
  if (DOCUMENTATION_EXTS.has(ext)) return "DOCUMENTATION";

  return null;
}

export class ExtractTask implements PipelineTask {
  name = "EXTRACTING";

  async execute(ctx: PipelineContext): Promise<void> {
    const startTime = Date.now();
    logger.info(`[ExtractTask] Started for repository ${ctx.repositoryId}`);

    const { REPOSITORY_STORAGE_PATH } = await import("../../../config");
    const repoPath = path.join(REPOSITORY_STORAGE_PATH, ctx.repositoryId);

    try {
      const filePaths: string[] = [];
      const walk = async (currentDir: string) => {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        const promises = entries.map(async (entry) => {
          const fullPath = path.join(currentDir, entry.name);
          if (entry.isDirectory()) {
            if (IGNORE_DIRS.has(entry.name)) return;
            await walk(fullPath);
          } else if (entry.isFile()) {
            const classification = classifyFile(entry.name);
            if (classification) {
              // Verify file size limit before queueing for extraction
              try {
                const stats = await fs.stat(fullPath);
                if (stats.size <= MAX_FILE_SIZE_BYTES) {
                  filePaths.push(fullPath);
                } else {
                  logger.warn(`[ExtractTask] Skipped large file (>2MB): ${entry.name} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                }
              } catch (statErr) {
                logger.warn(`[ExtractTask] Failed to stat file ${entry.name}: ${statErr}`);
              }
            }
          }
        });
        await Promise.all(promises);
      };

      await walk(repoPath);
      logger.info(`[ExtractTask] Found ${filePaths.length} candidate files under 2MB. Commencing batched content read...`);

      const extracted: Array<{
        filePath: string;
        content: string;
        classification: FileClassification;
      }> = [];

      // Read files in chunks of 50 to avoid EMFILE (too many open files) descriptor limits
      const chunkSize = 50;
      for (let i = 0; i < filePaths.length; i += chunkSize) {
        const batch = filePaths.slice(i, i + chunkSize);
        const batchResults = await Promise.all(
          batch.map(async (fullPath) => {
            try {
              const relativePath = path.relative(repoPath, fullPath);
              const content = await fs.readFile(fullPath, "utf-8");
              const classification = classifyFile(path.basename(fullPath))!;
              return { filePath: relativePath, content, classification };
            } catch (err) {
              logger.warn(`Skipped content extraction for file ${fullPath}: ${err}`);
              return null;
            }
          })
        );
        extracted.push(...(batchResults.filter(Boolean) as any));
      }

      ctx.processedFiles = extracted.length;
      ctx.totalFiles = extracted.length;

      // Temporarily store the extracted files on context so ChunkTask can access them
      (ctx as any).extractedFiles = extracted;

      const duration = (Date.now() - startTime) / 1000;
      logger.info(`[ExtractTask] Completed in ${duration.toFixed(2)} seconds. Extracted: ${extracted.length} files`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`[ExtractTask] Failed: ${err.message}`, err);
      throw new AppError(`File extraction failed: ${err.message}`, 500);
    }
  }
}
