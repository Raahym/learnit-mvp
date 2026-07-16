import { NextResponse } from "next/server";
import { getAiContext, requireUserWhenConfigured } from "../_shared";

export async function POST(request: Request) {
  const { error } = await requireUserWhenConfigured(request);
  if (error) return error;

  const { body, subject, topic, error: contextError } = await getAiContext(request);
  if (contextError) return contextError;
  const examDate = body?.examDate ? String(body.examDate) : "upcoming exam";
  const weeklyHours = Number(body?.weeklyHours ?? 5);
  const blocks = Math.max(3, Math.min(8, weeklyHours));

  return NextResponse.json({
    ok: true,
    subject,
    topic,
    plan: {
      examDate,
      weeklyHours,
      readinessGoal: "Improve weak-topic readiness before broad revision.",
      blocks: Array.from({ length: blocks }, (_, index) => ({
        day: `Session ${index + 1}`,
        focus: index % 2 === 0 ? topic : `${subject} mixed practice`,
        minutes: 45,
        output: index % 2 === 0 ? "flashcards + worked example" : "quiz attempt + mistake review"
      }))
    }
  });
}
