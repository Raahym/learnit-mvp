import type { SupabaseClient } from "@supabase/supabase-js";

export function clampReadiness(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function updateSubjectReadiness(
  supabase: SupabaseClient,
  userId: string,
  subjectName: string,
  delta: number,
  weakTopic?: string
) {
  const { data } = await supabase
    .from("subjects")
    .select("id, readiness")
    .eq("user_id", userId)
    .eq("name", subjectName)
    .maybeSingle();

  if (!data) {
    return null;
  }

  const nextReadiness = clampReadiness(Number(data.readiness ?? 50) + delta);
  const update: Record<string, unknown> = { readiness: nextReadiness };

  if (weakTopic) {
    update.weak_topic = weakTopic;
  }

  await supabase
    .from("subjects")
    .update(update)
    .eq("id", data.id)
    .eq("user_id", userId);

  return nextReadiness;
}
