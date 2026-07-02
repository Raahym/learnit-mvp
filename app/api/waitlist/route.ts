import { NextResponse } from "next/server";
import { getSupabaseAdmin, hasSupabaseServerConfig } from "@/lib/supabase";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const role = String(body?.role ?? "student").trim();
  const examGoal = String(body?.examGoal ?? "").trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required." }, { status: 400 });
  }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase" });
}
