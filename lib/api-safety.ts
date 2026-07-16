import { NextResponse } from "next/server";
import { z } from "zod";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function clientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function safeError(message = "Something went wrong.", status = 500) {
  return NextResponse.json({ error: message }, { status });
}

export function logServerError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error);
}

export function rateLimit(
  request: Request,
  options: {
    key: string;
    limit: number;
    windowMs: number;
  }
) {
  const now = Date.now();
  const id = `${options.key}:${clientIp(request)}`;
  const bucket = buckets.get(id);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(id, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > options.limit) {
    return NextResponse.json(
      { error: "Too many requests. Please wait and try again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000))
        }
      }
    );
  }

  return null;
}

export async function parseJson<T extends z.ZodTypeAny>(request: Request, schema: T) {
  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          error: "Invalid request.",
          details: result.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    };
  }

  return { data: result.data as z.infer<T>, error: null };
}

export const shortText = (max = 120) => z.string().trim().min(1).max(max);
export const optionalShortText = (max = 120) => z.string().trim().max(max).optional().nullable();
