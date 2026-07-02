import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";
import { updateSubjectReadiness } from "@/lib/study-progress";

export async function GET(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo", attempts: [] });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from("quiz_attempts")
    .select("id, subject, topic, question, selected_answer, correct_answer, is_correct, confidence, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", attempts: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const subject = String(body?.subject ?? "").trim();
  const topic = String(body?.topic ?? "").trim();
  const question = String(body?.question ?? "").trim();
  const selectedAnswer = String(body?.selectedAnswer ?? "").trim();
  const correctAnswer = String(body?.correctAnswer ?? "").trim();
  const confidence = Number(body?.confidence ?? 3);
  const isCorrect = selectedAnswer === correctAnswer;

  if (!subject || !topic || !question || !selectedAnswer || !correctAnswer) {
    return NextResponse.json({ error: "Quiz attempt is incomplete." }, { status: 400 });
  }

  if (!Number.isFinite(confidence) || confidence < 1 || confidence > 5) {
    return NextResponse.json({ error: "Confidence must be between 1 and 5." }, { status: 400 });
  }

  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo", isCorrect });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase!
    .from("quiz_attempts")
    .insert({
      user_id: userId,
      subject,
      topic,
      question,
      selected_answer: selectedAnswer,
      correct_answer: correctAnswer,
      is_correct: isCorrect,
      confidence
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const readinessDelta = isCorrect ? 2 : -3;
  const readiness = await updateSubjectReadiness(
    supabase!,
    userId,
    subject,
    readinessDelta,
    isCorrect ? undefined : topic
  );

  return NextResponse.json({ ok: true, mode: "supabase", isCorrect, readinessDelta, readiness });
}
