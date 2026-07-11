import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { SearchController } from "../controllers/search.controller";
import { RepositorySearchService } from "../services/repository-search.service";

const router = Router();

// Lazy initialize default services & controllers
const repositorySearchService = new RepositorySearchService();
const searchController = new SearchController(repositorySearchService);

// Search endpoint requires Clerk authentication middleware
router.post("/", requireAuth, searchController.search);

export default router;
