import * as fs from "fs";
import * as path from "path";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export type FileClassification =
  | "SOURCE_CODE"
  | "MARKUP"
  | "STYLESHEET"
  | "CONFIGURATION"
  | "DOCUMENTATION";

export interface ExtractedFile {
  filePath: string;
  content: string;
  classification: FileClassification;
}

const SOURCE_CODE_EXTS = new Set([
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
  ".mjs",
  ".cjs",
  ".sql",
]);

const MARKUP_EXTS = new Set([
  ".html",
]);

const STYLESHEET_EXTS = new Set([
  ".css",
  ".scss",
  ".sass",
  ".less",
]);

const CONFIGURATION_EXTS = new Set([
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".xml",
  ".graphql",
  ".gql",
]);

const CONFIGURATION_FILES = new Set([
  ".env.example",
]);

const DOCUMENTATION_EXTS = new Set([
  ".md",
  ".mdx",
]);

const IGNORED_FILENAMES = new Set([
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
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

function classifyFile(fileName: string): FileClassification | null {
  if (IGNORED_FILENAMES.has(fileName)) {
    return null;
  }

  if (CONFIGURATION_FILES.has(fileName)) {
    return "CONFIGURATION";
  }

  const ext = path.extname(fileName).toLowerCase();

  if (SOURCE_CODE_EXTS.has(ext)) return "SOURCE_CODE";
  if (MARKUP_EXTS.has(ext)) return "MARKUP";
  if (STYLESHEET_EXTS.has(ext)) return "STYLESHEET";
  if (CONFIGURATION_EXTS.has(ext)) return "CONFIGURATION";
  if (DOCUMENTATION_EXTS.has(ext)) return "DOCUMENTATION";

  return null;
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
    const countMap = {
      SOURCE_CODE: 0,
      MARKUP: 0,
      STYLESHEET: 0,
      CONFIGURATION: 0,
      DOCUMENTATION: 0,
    };

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
          const classification = classifyFile(entry.name);
          if (classification) {
            try {
              const content = fs.readFileSync(fullPath, "utf-8");
              files.push({
                filePath: relativePath,
                content,
                classification,
              });
              countMap[classification]++;
            } catch (err) {
              logger.warn(`Skipped content extraction for file ${relativePath}: ${err}`);
            }
          }
        }
      }
    };

    walk(repoPath);

    logger.info(
      `Extracted:\n` +
      `${countMap.SOURCE_CODE} Source Code Files\n` +
      `${countMap.MARKUP} HTML Files\n` +
      `${countMap.STYLESHEET} CSS Files\n` +
      `${countMap.CONFIGURATION} Configuration Files\n` +
      `${countMap.DOCUMENTATION} Documentation Files\n` +
      `Total Files Indexed: ${files.length}`
    );

    return files;
  }
}
