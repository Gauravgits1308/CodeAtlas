import { Router } from "express";
import { GitHubController } from "../controllers/github.controller";
import { GitHubService } from "../services/github.service";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Dependency injection instantiations
const githubService = new GitHubService();
const githubController = new GitHubController(githubService);

// GET /api/v1/github/repositories
router.get("/repositories", requireAuth, githubController.getUserRepositories);

export default router;
