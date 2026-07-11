import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { DocumentationController } from "../controllers/documentation.controller";

// Create router using mergeParams so the parent route parameter :id (repositoryId) resolves correctly
const router = Router({ mergeParams: true });
const controller = new DocumentationController();

router.post("/", requireAuth, controller.generateDocumentation);

export default router;
