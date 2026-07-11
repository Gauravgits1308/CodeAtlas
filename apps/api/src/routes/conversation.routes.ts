import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware";
import { ConversationController } from "../controllers/conversation.controller";
import { RepositoryConversationService } from "../services/repository-conversation.service";

const router = Router();

const repositoryConversationService = new RepositoryConversationService();
const conversationController = new ConversationController(repositoryConversationService);

router.get("/", requireAuth, conversationController.listConversations);
router.get("/:id/messages", requireAuth, conversationController.getMessages);
router.patch("/:id", requireAuth, conversationController.renameConversation);
router.delete("/:id", requireAuth, conversationController.deleteConversation);

export default router;
