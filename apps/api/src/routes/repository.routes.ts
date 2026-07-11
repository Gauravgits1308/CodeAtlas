import { Router } from "express";
import { RepositoryController } from "../controllers/repository.controller";
import { RepositoryService } from "../services/repository.service";
import { RepositoryRepository } from "../repositories/repository.repository";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Instantiate dependencies
const repositoryRepository = new RepositoryRepository();
const repositoryService = new RepositoryService(repositoryRepository);
const repositoryController = new RepositoryController(repositoryService);

// GET /api/v1/repositories
router.get("/", requireAuth, repositoryController.getUserRepositories);

// POST /api/v1/repositories/import
router.post("/import", requireAuth, repositoryController.importRepositories);

// POST /api/v1/repositories/:id/clone
router.post("/:id/clone", requireAuth, repositoryController.cloneRepository);

// POST /api/v1/repositories/:id/analyze
router.post("/:id/analyze", requireAuth, repositoryController.analyzeRepository);

// POST /api/v1/repositories/:id/process
router.post("/:id/process", requireAuth, repositoryController.processRepository);

// GET /api/v1/repositories/:id/files
router.get("/:id/files", requireAuth, repositoryController.getRepositoryFiles);

// GET /api/v1/repositories/:id/file
router.get("/:id/file", requireAuth, repositoryController.getRepositoryFileContent);

export default router;
