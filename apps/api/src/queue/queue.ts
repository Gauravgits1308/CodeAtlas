
import { config } from "../config";

const redisUrl = new URL(config.redisUrl);

const redisOptions = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
  username: redisUrl.username
    ? decodeURIComponent(redisUrl.username)
    : undefined,
  password: redisUrl.password
    ? decodeURIComponent(redisUrl.password)
    : undefined,
  ...(redisUrl.protocol === "rediss:" ? { tls: {} } : {}),
};

export const redisConnection = {
  ...redisOptions,
  maxRetriesPerRequest: null,
};
