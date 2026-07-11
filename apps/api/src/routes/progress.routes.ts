import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { ProgressController } from "../controllers/progress.controller";

const router = Router({ mergeParams: true });
const controller = new ProgressController();

router.get("/", requireAuth, controller.getProgress);
router.get("/stream", requireAuth, controller.streamProgress);

export default router;
