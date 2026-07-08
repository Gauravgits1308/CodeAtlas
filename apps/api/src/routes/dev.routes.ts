import { Router } from "express";
import { DevController } from "../controllers/dev.controller";

const router = Router();
const devController = new DevController();

// POST /api/v1/dev/embedding - Temporary development testing endpoint
router.post("/embedding", devController.testEmbedding);

export default router;
