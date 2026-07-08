import { Queue } from "bullmq";
import { redisConnection } from "./queue";

export const QUEUE_NAME = "repository-processing";

export const repositoryQueue = new Queue(QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
