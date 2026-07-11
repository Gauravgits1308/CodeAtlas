import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { DiagramController } from "../controllers/diagram.controller";

const router = Router({ mergeParams: true });
const controller = new DiagramController();

router.get("/", requireAuth, controller.getDiagram);

export default router;
