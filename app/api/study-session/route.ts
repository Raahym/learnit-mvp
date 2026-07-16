import { NextResponse } from "next/server";
import { z } from "zod";
import { logServerError, parseJson, rateLimit, safeError, shortText } from "@/lib/api-safety";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";
import { updateSubjectReadiness } from "@/lib/study-progress";

const studySessionSchema = z.object({
  subject: shortText(120),
  topic: shortText(160),
  confidence: z.coerce.number().int().min(1).max(5).default(3),
  minutes: z.coerce.number().int().min(1).max(720).default(25),
  weakTopic: z.string().trim().max(160).optional().nullable()
});

export async function GET(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo", sessions: [] });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from("study_sessions")
    .select("id, subject, topic, confidence, minutes, readiness_gain, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", sessions: data ?? [] });
}

export async function POST(request: Request) {
  const limited = rateLimit(request, { key: "study-session:post", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseJson(request, studySessionSchema);
  if (parsed.error) return parsed.error;
  const { subject, topic, confidence, minutes } = parsed.data;
  const weakTopic = parsed.data.weakTopic ?? "";

  const readinessGain = Math.min(8, Math.round(minutes / 12 + confidence));

  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      readinessGain,
      recommendation: `Review ${topic} again tomorrow, then take a mixed ${subject} quiz.`
    });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase!
    .from("study_sessions")
    .insert({ user_id: userId, subject, topic, confidence, minutes, readiness_gain: readinessGain });

  if (error) {
    logServerError("study-session.insert", error);
    return safeError("Study session could not be saved.");
  }

  const readiness = await updateSubjectReadiness(supabase!, userId, subject, readinessGain, weakTopic || topic);

  return NextResponse.json({
    ok: true,
    mode: "supabase",
    readinessGain,
    readiness,
    recommendation: `Review ${topic} again tomorrow, then take a mixed ${subject} quiz.`
  });
}
