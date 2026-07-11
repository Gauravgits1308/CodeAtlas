import { PipelineTask, PipelineContext } from "../Task";
import { CodeMetricRepository } from "../../../repositories/code-metric.repository";
import { promises as fs } from "fs";
import * as path from "path";
import { logger } from "../../../utils/logger";
import { AppError } from "../../../utils/errors";
 
const EXTENSION_MAP: Record<string, string> = {
  ".ts": "TypeScript", ".tsx": "TypeScript", ".js": "JavaScript", ".jsx": "JavaScript",
  ".mjs": "JavaScript", ".cjs": "JavaScript", ".py": "Python", ".java": "Java",
  ".cpp": "C++", ".c": "C", ".go": "Go", ".rs": "Rust", ".cs": "C#", ".php": "PHP",
  ".rb": "Ruby", ".sql": "SQL", ".html": "HTML", ".css": "CSS", ".scss": "SCSS",
  ".sass": "Sass", ".less": "Less", ".json": "JSON", ".yml": "YAML", ".yaml": "YAML",
  ".toml": "TOML", ".xml": "XML", ".graphql": "GraphQL", ".gql": "GraphQL",
  ".md": "Markdown", ".mdx": "Markdown",
};
 
const IGNORED_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp",
  ".mp4", ".mov", ".pdf", ".zip", ".rar", ".7z", ".exe"
]);
const IGNORED_FILENAMES = new Set([".env", ".env.local", ".env.production", ".env.development"]);
const IGNORE_DIRS = new Set([".git", "node_modules", "dist", "build", ".next", "coverage", "out", "vendor"]);
 
export class MetricTask implements PipelineTask {
  name = "CALCULATING_METRICS";
 
  private codeMetricRepository = new CodeMetricRepository();
 
  async execute(ctx: PipelineContext): Promise<void> {
    const startTime = Date.now();
    logger.info(`[MetricTask] Started for repository ${ctx.repositoryId}`);
 
    const repoPath = path.join(__dirname, "../../../../../storage/repositories", ctx.repositoryId);
 
    try {
      const candidates: { fullPath: string; relativePath: string; name: string }[] = [];
      const walk = async (currentDir: string) => {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        const promises = entries.map(async (entry) => {
          const fullPath = path.join(currentDir, entry.name);
          const relativePath = path.relative(repoPath, fullPath);
          if (entry.isDirectory()) {
            if (IGNORE_DIRS.has(entry.name)) return;
            await walk(fullPath);
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            if (!IGNORED_FILENAMES.has(entry.name) && !IGNORED_EXTENSIONS.has(ext)) {
              candidates.push({ fullPath, relativePath, name: entry.name });
            }
          }
        });
        await Promise.all(promises);
      };
 
      await walk(repoPath);
      logger.info(`[MetricTask] Analyzing metrics for ${candidates.length} files concurrently...`);
 
      let totalLines = 0;
      let totalBytes = 0;
      const languageLines: Record<string, number> = {};
      const fileList: { path: string; lines: number; size: number }[] = [];
      const dirFileCounts: Record<string, number> = {};
 
      const parsePromises = candidates.map(async (f) => {
        try {
          const stats = await fs.stat(f.fullPath);
          totalBytes += stats.size;
 
          const ext = path.extname(f.name).toLowerCase();
          const language = EXTENSION_MAP[ext];
          let lines = 0;
 
          if (language) {
            const content = await fs.readFile(f.fullPath, "utf-8");
            lines = content.split(/\r?\n/).length;
            totalLines += lines;
            languageLines[language] = (languageLines[language] || 0) + lines;
          }
 
          fileList.push({ path: f.relativePath, lines, size: stats.size });
          const dirRelativePath = path.dirname(f.relativePath) || ".";
          dirFileCounts[dirRelativePath] = (dirFileCounts[dirRelativePath] || 0) + 1;
        } catch (err) {
          logger.warn(`Skipped content analysis for file ${f.relativePath}: ${err}`);
        }
      });
 
      await Promise.all(parsePromises);
 
      // Calculate language percentage splits
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
 
      const averageFileSize = candidates.length > 0 ? parseFloat((totalBytes / candidates.length).toFixed(2)) : 0.0;
 
      // Dependency counts from root package.json if present
      let dependencyCount = 0;
      const pkgPath = path.join(repoPath, "package.json");
      try {
        const pkgContent = await fs.readFile(pkgPath, "utf-8");
        const pkg = JSON.parse(pkgContent);
        dependencyCount =
          Object.keys(pkg.dependencies || {}).length +
          Object.keys(pkg.devDependencies || {}).length;
      } catch {
        // Skip dependencies count if no package.json or invalid JSON format
      }
 
      await this.codeMetricRepository.createOrUpdate({
        repositoryId: ctx.repositoryId,
        linesCount: totalLines,
        filesCount: candidates.length,
        languages: languagesList,
        largestFiles,
        largestDirectories,
        averageFileSize,
        dependencyCount,
      });
 
      const duration = (Date.now() - startTime) / 1000;
      logger.info(`[MetricTask] Completed in ${duration.toFixed(2)} seconds`);
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`[MetricTask] Failed: ${err.message}`, err);
      throw new AppError(`Code metrics analysis failed: ${err.message}`, 500);
    }
  }
}
