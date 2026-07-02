import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";

export type AiRequest = {
  subject: string;
  topic: string;
  sourceText?: string;
  count?: number;
};

export async function getAiContext(request: Request) {
  const body = await request.json().catch(() => null);
  const subject = String(body?.subject ?? "General").trim() || "General";
  const topic = String(body?.topic ?? "Revision").trim() || "Revision";
  const sourceText = body?.sourceText ? String(body.sourceText).trim().slice(0, 4000) : "";
  const count = Math.max(1, Math.min(12, Number(body?.count ?? 5)));
  const userId = await getUserIdFromRequest(request);

  return { body, subject, topic, sourceText, count, userId };
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
