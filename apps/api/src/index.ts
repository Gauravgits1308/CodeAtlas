import { config } from "./config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";
import { validateClerkConfig } from "./config/clerk";
import { logger } from "./utils/logger";
import { connectDb, prisma } from "./database";
import { globalErrorHandler, notFoundHandler } from "./middleware/errors";
import authRouter from "./routes/auth.routes";
import githubRouter from "./routes/github.routes";
import repositoryRouter from "./routes/repository.routes";
import jobRouter from "./routes/job.routes";
import devRouter from "./routes/dev.routes";
import contactRouter from "./routes/contact.routes";
import searchRouter from "./routes/search.routes";
import chatRouter from "./routes/chat.routes";
import "./workers/repository.worker";

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware()); // Attach Clerk session identities globally

// Morgan HTTP request logging piped into Winston logger streams
const morganStream = {
  write: (message: string) => logger.info(message.trim()),
};
app.use(morgan(":method :url :status :res[content-length] - :response-time ms", { stream: morganStream }));

// Register REST Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/github", githubRouter);
app.use("/api/v1/repositories", repositoryRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/dev", devRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/search", searchRouter);
app.use("/api/v1/chat", chatRouter);

// Health Check Endpoints
app.get("/health", async (req, res) => {
  let databaseStatus = "disconnected";
  try {
    // Run simple query raw verification
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus = "connected";
  } catch (error) {
    databaseStatus = "disconnected";
  }

  res.status(200).json({
    status: "ok",
    database: databaseStatus,
    server: "running",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// App Version Endpoint
app.get("/version", (req, res) => {
  res.status(200).json({
    version: "0.1.0",
    nodeVersion: process.version,
    environment: config.nodeEnv,
  });
});

// Error Catchers
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Bootstrap Server
const startServer = async () => {
  // Validate authentication client configuration setup
  validateClerkConfig();

  // Connect database
  await connectDb();

  app.listen(config.port, () => {
    logger.info(`Express server running on port ${config.port} in [${config.nodeEnv}] mode.`);
  });
};

startServer();
