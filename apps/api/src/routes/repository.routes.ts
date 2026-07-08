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

// POST /api/v1/repositories/import
router.post("/import", requireAuth, repositoryController.importRepositories);

export default router;
