import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { ExplainSelectionController } from "../controllers/explain-selection.controller";

const router = Router();
const controller = new ExplainSelectionController();

router.post("/", requireAuth, controller.explainSelection);

export default router;
