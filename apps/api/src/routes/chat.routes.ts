import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { ChatController } from "../controllers/chat.controller";
import { RepositoryChatService } from "../services/repository-chat.service";

const router = Router();

// Lazy initialize default services & controllers
const repositoryChatService = new RepositoryChatService();
const chatController = new ChatController(repositoryChatService);

// Chat endpoint requires Clerk authentication middleware
router.post("/", requireAuth, chatController.chat);
router.post("/stream", requireAuth, chatController.chatStream);

export default router;
