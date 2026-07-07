import winston from "winston"
import path from "path"
import { config } from "../config"

const { combine, timestamp, printf, colorize, errors, json } = winston.format

// Console output formatting helper
const consoleFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`
})

const logger = winston.createLogger({
  level: config.nodeEnv === "development" ? "debug" : "info",
  format: combine(
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    errors({ stack: true })
  ),
  transports: [],
})

// Configure transport options based on runtime target environment
if (config.nodeEnv === "development") {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), consoleFormat),
    })
  )
} else {
  logger.add(
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/error.log"),
      level: "error",
      format: combine(json()),
    })
  )
  logger.add(
    new winston.transports.File({
      filename: path.join(__dirname, "../../logs/combined.log"),
      format: combine(json()),
    })
  )
}

export { logger }
