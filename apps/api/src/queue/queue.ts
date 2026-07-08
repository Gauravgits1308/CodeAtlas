import { ConnectionOptions } from "bullmq";
import { config } from "../config";

export const redisConnection: ConnectionOptions = {
  host: config.redisHost,
  port: config.redisPort,
  password: config.redisPassword || undefined,
};
