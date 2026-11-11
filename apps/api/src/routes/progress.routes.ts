import { Router, Request, Response, NextFunction } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { ProgressController } from "../controllers/progress.controller";

const router = Router({ mergeParams: true });
const controller = new ProgressController();

// Middleware to disable HTTP caching and ETags for progress endpoints
router.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

router.get("/", requireAuth, controller.getProgress);
router.get("/stream", requireAuth, controller.streamProgress);

export default router;
