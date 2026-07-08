import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";

const router = Router();

// Instantiate placeholder controller directly
const authController = new AuthController();

// Register REST Endpoints without security check middleware
router.get("/me", authController.getCurrentUser);
router.post("/sync", authController.syncUser);

export default router;
