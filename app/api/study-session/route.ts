import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";
import { updateSubjectReadiness } from "@/lib/study-progress";

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
  const body = await request.json().catch(() => null);
  const subject = String(body?.subject ?? "").trim();
  const topic = String(body?.topic ?? "").trim();
  const confidence = Number(body?.confidence ?? 3);
  const minutes = Number(body?.minutes ?? 25);
  const weakTopic = body?.weakTopic ? String(body.weakTopic).trim() : "";

  if (!subject || !topic) {
    return NextResponse.json({ error: "Subject and topic are required." }, { status: 400 });
  }

  if (!Number.isFinite(confidence) || confidence < 1 || confidence > 5) {
    return NextResponse.json({ error: "Confidence must be between 1 and 5." }, { status: 400 });
  }

  if (!Number.isFinite(minutes) || minutes < 1) {
    return NextResponse.json({ error: "Minutes must be positive." }, { status: 400 });
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
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
