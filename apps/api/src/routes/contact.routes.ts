import { Router } from "express";
import { ContactController } from "../controllers/contact.controller";

const router = Router();
const contactController = new ContactController();

// POST /api/v1/contact
router.post("/", contactController.submitContact);

export default router;
