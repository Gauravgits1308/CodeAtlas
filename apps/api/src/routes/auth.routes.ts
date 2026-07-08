import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { AuthService } from "../services/auth.service";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Instantiate dependency and inject into controller
const authService = new AuthService();
const authController = new AuthController(authService);

// Register REST Endpoints protecting with requireAuth middleware
router.get("/me", requireAuth, authController.getCurrentUser);
router.post("/sync", requireAuth, authController.syncUser);

export default router;
