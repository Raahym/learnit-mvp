import { NextResponse } from "next/server";
import { getAiContext, requireUserWhenConfigured } from "../_shared";

export async function POST(request: Request) {
  const { error } = await requireUserWhenConfigured(request);
  if (error) return error;

  const { body, subject, topic, error: contextError } = await getAiContext(request);
  if (contextError) return contextError;
  const question = String(body?.question ?? "the question").trim();
  const selectedAnswer = String(body?.selectedAnswer ?? "your answer").trim();
  const correctAnswer = String(body?.correctAnswer ?? "the correct answer").trim();

  return NextResponse.json({
    ok: true,
    subject,
    topic,
    explanation: {
      mistake: `You selected "${selectedAnswer}" for ${question}.`,
      correction: `The correct answer is "${correctAnswer}".`,
      simpleVersion: `Start from the rule for ${topic}, then match the numbers or definition to that rule.`,
      nextPractice: [`Redo one easy ${topic} example`, `Try one exam-style ${subject} question`, "Rate confidence from 1 to 5"]
    }
  });
}
