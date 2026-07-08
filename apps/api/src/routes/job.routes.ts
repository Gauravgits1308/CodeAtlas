import { Router } from "express";
import { JobController } from "../controllers/job.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();
const jobController = new JobController();

// GET /api/v1/jobs/:jobId
router.get("/:jobId", requireAuth, jobController.getJobStatus);

export default router;
