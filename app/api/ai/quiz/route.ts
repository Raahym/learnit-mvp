import { NextResponse } from "next/server";
import { getAiContext, getSupabaseMaybe, requireUserWhenConfigured, splitSource } from "../_shared";

export async function POST(request: Request) {
  const { userId, error } = await requireUserWhenConfigured(request);
  if (error) return error;

  const { subject, topic, sourceText, count, error: contextError } = await getAiContext(request);
  if (contextError) return contextError;
  const facts = splitSource(sourceText || `${topic} definition. ${topic} formula. ${topic} common mistake.`);
  const questions = Array.from({ length: count }, (_, index) => {
    const fact = facts[index % facts.length] ?? topic;
    return {
      question: `Which statement best matches ${topic} concept ${index + 1}?`,
      options: [fact, `Unrelated ${subject} detail`, "A calculation shortcut only", "None of the above"],
      correctAnswer: fact,
      explanation: `This checks whether you can recognize: ${fact}`
    };
  });

  const supabase = getSupabaseMaybe();
  if (supabase && userId) {
    await supabase.from("quizzes").insert({
      user_id: userId,
      subject,
      topic,
      title: `${topic} adaptive quiz`,
      questions
    });
  }

  return NextResponse.json({ ok: true, subject, topic, quiz: { title: `${topic} adaptive quiz`, questions } });
}
