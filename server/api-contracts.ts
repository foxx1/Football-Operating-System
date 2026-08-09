import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodSchema } from "zod";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function parseIdParam(value: string | undefined, name = "id"): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ApiError(400, "BAD_REQUEST", `Invalid ${name}`);
  }
  return id;
}

export function parseOptionalIntQuery(value: unknown, name: string): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    throw new ApiError(400, "BAD_REQUEST", `${name} must be a single value`);
  }

  return parseIdParam(String(value), name);
}

export function parseRequiredString(value: unknown, name: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError(400, "BAD_REQUEST", `${name} is required`);
  }
  return value.trim();
}

export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  return schema.parse(body);
}

export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, _res, next) => {
    try {
      req.body = parseBody(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function getPagination(query: Request["query"], defaults = { limit: 50, maxLimit: 200 }) {
  const rawLimit = query.limit === undefined ? defaults.limit : Number(query.limit);
  const rawOffset = query.offset === undefined ? 0 : Number(query.offset);

  if (!Number.isInteger(rawLimit) || rawLimit <= 0) {
    throw new ApiError(400, "BAD_REQUEST", "Invalid limit");
  }

  if (!Number.isInteger(rawOffset) || rawOffset < 0) {
    throw new ApiError(400, "BAD_REQUEST", "Invalid offset");
  }

  return {
    limit: Math.min(rawLimit, defaults.maxLimit),
    offset: rawOffset,
    search: typeof query.search === "string" ? query.search.trim() : undefined,
  };
}

export function sendApiError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: fallbackMessage,
        details: error.flatten(),
      },
    });
  }

  // body-parser throws this (status 413, type "entity.too.large") before a
  // route handler ever runs, so it otherwise falls through as an opaque 500.
  if (error && typeof error === "object" && (error as { type?: string }).type === "entity.too.large") {
    return res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large",
      },
    });
  }

  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: fallbackMessage,
    },
  });
}

export function apiErrorHandler(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  sendApiError(res, err, "Internal Server Error");
}
