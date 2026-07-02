import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseServerConfig } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const subject = String(body?.subject ?? "").trim();
  const topic = String(body?.topic ?? "").trim();
  const confidence = Number(body?.confidence ?? 3);
  const minutes = Number(body?.minutes ?? 25);

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

  const supabase = getSupabaseAdmin();
  const { error } = await supabase!
    .from("study_sessions")
    .insert({ subject, topic, confidence, minutes });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    mode: "supabase",
    readinessGain,
    recommendation: `Review ${topic} again tomorrow, then take a mixed ${subject} quiz.`
  });
}
