import * as fs from "fs";
import * as path from "path";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

const SUPPORTED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".java",
  ".go",
  ".rs",
  ".cpp",
  ".c",
  ".cs",
  ".php",
  ".rb",
  ".md",
]);

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  "out",
  "vendor",
]);

export interface ExtractedFile {
  filePath: string;
  content: string;
}

export class FileExtractionService {
  /**
   * Recursively walks a cloned repository folder and extracts content from supported text code files.
   */
  extractFiles(repositoryId: string): ExtractedFile[] {
    const repoPath = path.join(__dirname, "../../../../storage/repositories", repositoryId);

    if (!fs.existsSync(repoPath)) {
      throw new AppError("Repository directory does not exist locally.", 400);
    }

    const files: ExtractedFile[] = [];

    const walk = (currentDir: string) => {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativePath = path.relative(repoPath, fullPath);

        if (entry.isDirectory()) {
          if (IGNORE_DIRS.has(entry.name)) {
            continue;
          }
          walk(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (SUPPORTED_EXTENSIONS.has(ext)) {
            try {
              const content = fs.readFileSync(fullPath, "utf-8");
              files.push({
                filePath: relativePath,
                content,
              });
            } catch (err) {
              logger.warn(`Skipped content extraction for file ${relativePath}: ${err}`);
            }
          }
        }
      }
    };

    walk(repoPath);
    return files;
  }
}
