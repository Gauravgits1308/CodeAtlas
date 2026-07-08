import * as fs from "fs";
import * as path from "path";
import { logger } from "../utils/logger";
import { AppError } from "../utils/errors";

const EXTENSION_MAP: Record<string, string> = {
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".js": "JavaScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".java": "Java",
  ".cpp": "C++",
  ".c": "C",
  ".go": "Go",
  ".rs": "Rust",
  ".md": "Markdown",
  ".json": "JSON",
  ".yml": "YAML",
  ".yaml": "YAML",
};

const IGNORE_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  "coverage",
  "out",
]);

export interface AnalysisResult {
  linesCount: number;
  filesCount: number;
  languages: { name: string; percentage: number }[];
  largestFiles: { path: string; lines: number }[];
  largestDirectories: { path: string; filesCount: number }[];
  averageFileSize: number;
  dependencyCount: number;
}

export class RepositoryAnalysisService {
  async analyze(repositoryId: string): Promise<AnalysisResult> {
    const repoPath = path.join(__dirname, "../../../../storage/repositories", repositoryId);

    if (!fs.existsSync(repoPath)) {
      throw new AppError("Repository codebase has not been cloned locally.", 400);
    }

    logger.info(`Code analysis started for repository: ${repositoryId}`);

    let totalFiles = 0;
    let totalLines = 0;
    let totalBytes = 0;
    const languageLines: Record<string, number> = {};
    const fileList: { path: string; lines: number; size: number }[] = [];
    const dirFileCounts: Record<string, number> = {};

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
          totalFiles++;
          const stats = fs.statSync(fullPath);
          totalBytes += stats.size;

          const ext = path.extname(entry.name).toLowerCase();
          const language = EXTENSION_MAP[ext];

          let lines = 0;
          if (language) {
            try {
              // Read text content to extract LOC (lines of code)
              const content = fs.readFileSync(fullPath, "utf-8");
              lines = content.split(/\r?\n/).length;
              totalLines += lines;
              languageLines[language] = (languageLines[language] || 0) + lines;
            } catch (err) {
              logger.warn(`Could not extract line counts for file ${relativePath}: ${err}`);
            }
          }

          fileList.push({
            path: relativePath,
            lines,
            size: stats.size,
          });

          const dirRelativePath = path.relative(repoPath, currentDir) || ".";
          dirFileCounts[dirRelativePath] = (dirFileCounts[dirRelativePath] || 0) + 1;
        }
      }
    };

    try {
      walk(repoPath);
    } catch (error) {
      logger.error(`Analysis failed during file walk for repository ${repositoryId}`, error);
      throw new AppError("Failed to parse codebase hierarchy.", 500);
    }

    // Sort and calculate percentages
    const languagesList = Object.entries(languageLines)
      .map(([name, lines]) => {
        const percentage = totalLines > 0 ? parseFloat(((lines / totalLines) * 100).toFixed(1)) : 0.0;
        return { name, percentage };
      })
      .sort((a, b) => b.percentage - a.percentage);

    const largestFiles = fileList
      .sort((a, b) => b.lines - a.lines)
      .slice(0, 5)
      .map((f) => ({ path: f.path, lines: f.lines }));

    const largestDirectories = Object.entries(dirFileCounts)
      .map(([dirPath, count]) => ({ path: dirPath, filesCount: count }))
      .sort((a, b) => b.filesCount - a.filesCount)
      .slice(0, 5);

    const averageFileSize = totalFiles > 0 ? parseFloat((totalBytes / totalFiles).toFixed(2)) : 0.0;

    // Parse root package.json dependency listings if present
    let dependencyCount = 0;
    const pkgPath = path.join(repoPath, "package.json");
    if (fs.existsSync(pkgPath)) {
      try {
        const pkgContent = fs.readFileSync(pkgPath, "utf-8");
        const pkg = JSON.parse(pkgContent);
        dependencyCount =
          Object.keys(pkg.dependencies || {}).length +
          Object.keys(pkg.devDependencies || {}).length;
      } catch (err) {
        logger.warn(`Dependency count skipped. package.json not parsed at ${repositoryId}: ${err}`);
      }
    }

    logger.info(`Code analysis completed successfully for repository: ${repositoryId}`);

    return {
      linesCount: totalLines,
      filesCount: totalFiles,
      languages: languagesList,
      largestFiles,
      largestDirectories,
      averageFileSize,
      dependencyCount,
    };
  }
}
