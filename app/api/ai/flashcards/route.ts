import { NextResponse } from "next/server";
import { getAiContext, getSupabaseMaybe, requireUserWhenConfigured, splitSource } from "../_shared";

export async function POST(request: Request) {
  const { userId, error } = await requireUserWhenConfigured(request);
  if (error) return error;

  const { subject, topic, sourceText, count } = await getAiContext(request);
  const facts = splitSource(sourceText || `${topic} key idea. ${topic} exam mistake. ${topic} definition.`);
  const flashcards = Array.from({ length: count }, (_, index) => {
    const fact = facts[index % facts.length] ?? topic;
    return {
      front: `${topic}: ${index + 1}`,
      back: fact,
      difficulty: index < 2 ? "easy" : "exam"
    };
  });

  const supabase = getSupabaseMaybe();
  if (supabase && userId) {
    await supabase.from("flashcards").insert(
      flashcards.map((card) => ({
        user_id: userId,
        subject,
        front: card.front,
        back: card.back
      }))
    );
  }

  return NextResponse.json({ ok: true, subject, topic, flashcards });
}
