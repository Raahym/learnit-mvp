import { NextResponse } from "next/server";
import { z } from "zod";
import { parseJson, rateLimit, shortText } from "@/lib/api-safety";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";

export type AiRequest = {
  subject: string;
  topic: string;
  sourceText?: string;
  count?: number;
};

const aiRequestSchema = z.object({
  subject: shortText(120).default("General"),
  topic: shortText(160).default("Revision"),
  sourceText: z.string().trim().max(4000).optional().default(""),
  count: z.coerce.number().int().min(1).max(12).default(5),
  question: z.string().trim().max(1000).optional(),
  selectedAnswer: z.string().trim().max(500).optional(),
  correctAnswer: z.string().trim().max(500).optional(),
  examDate: z.string().trim().max(80).optional(),
  weeklyHours: z.coerce.number().int().min(1).max(80).optional()
});

export async function getAiContext(request: Request) {
  const limited = rateLimit(request, { key: "ai:post", limit: 30, windowMs: 60_000 });
  if (limited) {
    return { body: null, subject: "", topic: "", sourceText: "", count: 0, userId: null, error: limited };
  }

  const parsed = await parseJson(request, aiRequestSchema);
  if (parsed.error) {
    return { body: null, subject: "", topic: "", sourceText: "", count: 0, userId: null, error: parsed.error };
  }

  const { subject, topic, sourceText, count } = parsed.data;
  const userId = await getUserIdFromRequest(request);

  return { body: parsed.data, subject, topic, sourceText, count, userId, error: null };
}

export async function requireUserWhenConfigured(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return { userId: null, error: null };
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Sign in required." }, { status: 401 })
    };
  }

  return { userId, error: null };
}

export function getSupabaseMaybe() {
  return hasSupabaseServerConfig() ? getSupabaseAdmin() : null;
}

export function splitSource(sourceText: string) {
  return sourceText
    .split(/[.\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
}
