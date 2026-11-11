import { logger } from "./logger";

/**
 * Traverses any data structure and strips all NUL (\u0000) characters from string fields.
 * This is crucial for PostgreSQL insertions, as Postgres does not support NUL bytes in text columns.
 */
export function sanitizeForPostgres<T>(val: T): T {
  if (typeof val === "string") {
    const originalLength = val.length;
    // Find all NUL bytes
    const nulBytesCount = (val.match(/\0/g) || []).length;
    if (nulBytesCount > 0) {
      const sanitized = val.replace(/\0/g, "");
      logger.info(`[sanitizeForPostgres] Detected and removed ${nulBytesCount} NUL byte(s). Original length: ${originalLength}, Sanitized length: ${sanitized.length}`);
      return sanitized as unknown as T;
    }
    return val;
  }

  if (Array.isArray(val)) {
    return val.map((item) => sanitizeForPostgres(item)) as unknown as T;
  }

  if (val !== null && typeof val === "object") {
    const res: any = {};
    for (const key of Object.keys(val)) {
      res[key] = sanitizeForPostgres((val as any)[key]);
    }
    return res as T;
  }

  return val;
}
