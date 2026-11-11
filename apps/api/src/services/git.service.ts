import simpleGit from "simple-git";
import * as fs from "fs";
import * as path from "path";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class GitService {
  /**
   * Clones a repository from a remote URL to a local destination directory with non-interactive flags and timeout protection.
   */
  async clone(cloneUrl: string, targetPath: string, timeoutMs: number = 120000): Promise<void> {
    const startTime = Date.now();

    // Support authenticating private GitHub repositories using GITHUB_TOKEN if available in the environment
    let finalCloneUrl = cloneUrl;
    const token = process.env.GITHUB_TOKEN;
    if (token && cloneUrl.startsWith("https://github.com/")) {
      finalCloneUrl = cloneUrl.replace("https://github.com/", `https://x-access-token:${token}@github.com/`);
    }

    logger.info(`[GitService] Starting git clone for URL: ${cloneUrl} (Authenticated: ${!!token}) -> Path: ${targetPath}`);

    // Ensure parent directory exists
    const parentDir = path.dirname(targetPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    // Clean target directory if it exists but is NOT a valid git repository
    const gitDir = path.join(targetPath, ".git");
    if (fs.existsSync(targetPath) && !fs.existsSync(gitDir)) {
      logger.info(`[GitService] Cleaning up non-git/partial target directory before clone: ${targetPath}`);
      try {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } catch (rmErr) {
        logger.warn(`[GitService] Directory cleanup warning for ${targetPath}: ${rmErr}`);
      }
    }

    // Log and sanitize environment variables to prevent simple-git from triggering safety plugin violations
    logger.info(`[GitService] Host Environment - EDITOR: ${process.env.EDITOR || "undefined"}, GIT_EDITOR: ${process.env.GIT_EDITOR || "undefined"}, VISUAL: ${process.env.VISUAL || "undefined"}`);

    const sanitizedEnv = { ...process.env };
    delete sanitizedEnv.EDITOR;
    delete sanitizedEnv.GIT_EDITOR;
    delete sanitizedEnv.VISUAL;
    delete sanitizedEnv.GIT_ASKPASS;
    delete sanitizedEnv.SSH_ASKPASS;

    // Configure simpleGit with non-interactive flags
    const git = simpleGit({
      baseDir: parentDir,
      binary: "git",
      maxConcurrentProcesses: 4,
      trimmed: true,
    });

    git.env({
      ...sanitizedEnv,
      GIT_TERMINAL_PROMPT: "0",
      GIT_CONFIG_NOSYSTEM: "1",
    });

    const clonePromise = git.clone(finalCloneUrl, targetPath, ["--depth", "1"]);

    // Timeout Promise Race Guard
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new AppError(`Git clone timed out after ${timeoutMs / 1000} seconds. Operation aborted.`, 504));
      }, timeoutMs);
    });

    try {
      await Promise.race([clonePromise, timeoutPromise]);
      clearTimeout(timeoutId!);

      const elapsed = Date.now() - startTime;
      logger.info(`[GitService] Git clone completed successfully in ${elapsed}ms for URL: ${cloneUrl}`);
    } catch (error) {
      clearTimeout(timeoutId!);
      const elapsed = Date.now() - startTime;

      // Clean up target directory if left in partially cloned state
      if (fs.existsSync(targetPath)) {
        try {
          fs.rmSync(targetPath, { recursive: true, force: true });
          logger.info(`[GitService] Cleaned up partial directory after failed clone: ${targetPath}`);
        } catch (cleanupErr) {
          logger.warn(`[GitService] Failed to clean up directory ${targetPath}: ${cleanupErr}`);
        }
      }

      const errMsg = error instanceof Error ? error.message : String(error);
      logger.error(`[GitService] Git clone failed after ${elapsed}ms for URL ${cloneUrl}: ${errMsg}`, error);

      if (error instanceof AppError) {
        throw error;
      }

      if (errMsg.includes("Authentication failed") || errMsg.includes("Could not read from remote")) {
        throw new AppError("Git clone failed due to invalid credentials or access denied. Ensure repository permissions are granted.", 401);
      }

      throw new AppError(`Failed to clone repository: ${errMsg}`, 500);
    }
  }

  /**
   * Verifies if a valid git repository folder exists at the target directory.
   */
  async exists(targetPath: string): Promise<boolean> {
    const gitDir = path.join(targetPath, ".git");
    return fs.existsSync(gitDir);
  }

  /**
   * Pulls the latest modifications (Stub only).
   */
  async pull(targetPath: string): Promise<void> {
    logger.info(`[GitService] Git pull requested for target path: ${targetPath} (Stubbed operation).`);
  }

  /**
   * Deletes the local checkout repository files (Stub only).
   */
  async delete(targetPath: string): Promise<void> {
    logger.info(`[GitService] Git delete requested for target path: ${targetPath} (Stubbed operation).`);
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  }
}
