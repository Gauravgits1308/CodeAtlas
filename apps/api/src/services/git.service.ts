import simpleGit from "simple-git";
import * as fs from "fs";
import * as path from "path";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export class GitService {
  /**
   * Clones a repository from a remote URL to a local destination directory.
   */
  async clone(cloneUrl: string, targetPath: string): Promise<void> {
    try {
      const git = simpleGit();
      await git.clone(cloneUrl, targetPath);
    } catch (error) {
      logger.error(`Git clone failed for URL: ${cloneUrl} into path: ${targetPath}`, error);
      throw new AppError("Failed to clone repository from remote source. Git checkout operation failed.", 500);
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
    logger.info(`Git pull requested for target path: ${targetPath} (Stubbed operation).`);
  }

  /**
   * Deletes the local checkout repository files (Stub only).
   */
  async delete(targetPath: string): Promise<void> {
    logger.info(`Git delete requested for target path: ${targetPath} (Stubbed operation).`);
  }
}
