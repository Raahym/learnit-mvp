import { NextResponse } from "next/server";
import { z } from "zod";
import { logServerError, parseJson, rateLimit, safeError } from "@/lib/api-safety";
import { getSupabaseAdmin, hasSupabaseServerConfig } from "@/lib/supabase";

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.string().trim().min(1).max(80).default("student"),
  examGoal: z.string().trim().max(160).optional().default("")
});

export async function POST(request: Request) {
  const limited = rateLimit(request, { key: "waitlist:post", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const parsed = await parseJson(request, waitlistSchema);
  if (parsed.error) return parsed.error;
  const { email, role, examGoal } = parsed.data;

  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      message: "Saved in demo mode. Add Supabase env vars to persist waitlist signups."
    });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase!
    .from("waitlist")
    .upsert({ email, role, exam_goal: examGoal }, { onConflict: "email" });

  if (error) {
    logServerError("waitlist.upsert", error);
    return safeError("Waitlist signup could not be saved.");
  }

  return NextResponse.json({ ok: true, mode: "supabase" });
}
