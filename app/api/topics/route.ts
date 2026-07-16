import { NextResponse } from "next/server";
import { z } from "zod";
import { logServerError, parseJson, rateLimit, safeError, shortText } from "@/lib/api-safety";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const topicSchema = z.object({
  subjectId: z.string().uuid().optional().nullable(),
  name: shortText(160),
  confidence: z.coerce.number().int().min(0).max(5).default(0),
  mastery: z.coerce.number().int().min(0).max(100).default(0),
  retention: z.coerce.number().int().min(0).max(100).default(0),
  coverageStatus: z.enum(["not_started", "learning", "reviewing", "exam_ready"]).default("not_started")
});

export async function GET(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo", topics: [] });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("topics")
    .select("id, subject_id, name, confidence, mastery, retention, coverage_status, last_reviewed_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    logServerError("topics.select", error);
    return safeError("Topics could not be loaded.");
  }

  return NextResponse.json({ ok: true, mode: "supabase", topics: data ?? [] });
}

export async function POST(request: Request) {
  const limited = rateLimit(request, { key: "topics:post", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const parsed = await parseJson(request, topicSchema);
  if (parsed.error) return parsed.error;
  const body = parsed.data;

  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("topics")
    .insert({
      user_id: userId,
      subject_id: body.subjectId || null,
      name: body.name,
      confidence: body.confidence,
      mastery: body.mastery,
      retention: body.retention,
      coverage_status: body.coverageStatus
    })
    .select("id, subject_id, name, confidence, mastery, retention, coverage_status, last_reviewed_at")
    .single();

  if (error) {
    logServerError("topics.insert", error);
    return safeError("Topic could not be saved.");
  }

  return NextResponse.json({ ok: true, mode: "supabase", topic: data });
}
