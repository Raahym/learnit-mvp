import { NextResponse } from "next/server";
import { z } from "zod";
import { logServerError, parseJson, rateLimit, safeError, shortText } from "@/lib/api-safety";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";
import { updateSubjectReadiness } from "@/lib/study-progress";

const quizAttemptSchema = z.object({
  subject: shortText(120),
  topic: shortText(160),
  question: shortText(1000),
  selectedAnswer: shortText(500),
  correctAnswer: shortText(500),
  confidence: z.coerce.number().int().min(1).max(5).default(3)
});

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
  const limited = rateLimit(request, { key: "quiz-attempt:post", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseJson(request, quizAttemptSchema);
  if (parsed.error) return parsed.error;
  const { subject, topic, question, selectedAnswer, correctAnswer, confidence } = parsed.data;
  const isCorrect = selectedAnswer === correctAnswer;

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
    logServerError("quiz-attempt.insert", error);
    return safeError("Quiz attempt could not be saved.");
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
