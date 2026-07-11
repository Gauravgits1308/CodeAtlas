import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { ExplainController } from "../controllers/explain.controller";

const router = Router();
const explainController = new ExplainController();

router.post("/", requireAuth, explainController.explainSelection);

export default router;
