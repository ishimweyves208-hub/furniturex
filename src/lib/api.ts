import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ConfigurationError } from "@/lib/env";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFIGURATION_REQUIRED"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static unauthorized(message = "You must be signed in.") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }
  static forbidden(message = "You do not have permission to perform this action.") {
    return new ApiError(403, "FORBIDDEN", message);
  }
  static notFound(message = "The requested resource was not found.") {
    return new ApiError(404, "NOT_FOUND", message);
  }
  static badRequest(message = "The request is invalid.", details?: unknown) {
    return new ApiError(400, "BAD_REQUEST", message, details);
  }
  static conflict(message = "The resource already exists.") {
    return new ApiError(409, "CONFLICT", message);
  }
  static rateLimited(message = "Too many requests. Please try again later.") {
    return new ApiError(429, "RATE_LIMITED", message);
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please correct the highlighted fields.",
          details: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      },
      { status: 422 },
    );
  }
  if (error instanceof ConfigurationError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CONFIGURATION_REQUIRED",
          message: error.message,
        },
      },
      { status: 503 },
    );
  }
  if (error && typeof error === "object" && "code" in error && error.code === 11000) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "CONFLICT", message: "A record with this value already exists." },
      },
      { status: 409 },
    );
  }

  console.error("[api] unhandled error", error);
  return NextResponse.json(
    {
      ok: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    },
    { status: 500 },
  );
}

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const requestedSize = Number.parseInt(searchParams.get("pageSize") ?? "", 10);
  const pageSize = Math.min(Math.max(Number.isFinite(requestedSize) ? requestedSize : 12, 1), 60);
  return { page, pageSize, skip: (page - 1) * pageSize };
}

export function parseJsonBody<T>(request: Request): Promise<T> {
  return request.json().catch(() => {
    throw ApiError.badRequest("Request body must be valid JSON.");
  }) as Promise<T>;
}
