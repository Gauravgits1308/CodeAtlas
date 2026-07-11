import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/errors";
import { ContactService } from "../services/contact.service";

export class ContactController {
  private contactService: ContactService;

  constructor(contactService?: ContactService) {
    this.contactService = contactService || new ContactService();
  }

  /**
   * Receives and validates contact form queries.
   */
  submitContact = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { name, email, subject, message } = req.body as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
    };

    // Delegate sanitization, validation, and email dispatching to ContactService
    await this.contactService.processContactSubmission({
      name: name || "",
      email: email || "",
      subject: subject || "",
      message: message || "",
    });

    res.status(200).json({
      success: true,
      message: "Your message has been sent successfully.",
    });
  });
}
