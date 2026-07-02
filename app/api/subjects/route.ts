import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";

export async function GET(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo", subjects: [] });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from("subjects")
    .select("id, name, exam_date, current_level, target_grade, weekly_hours, readiness, weak_topic, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", subjects: data ?? [] });
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const subjects = Array.isArray(body?.subjects) ? body.subjects : [body];

  const rows = subjects.map((subject: any) => ({
    user_id: userId,
    name: String(subject?.name ?? "").trim(),
    exam_date: subject?.examDate ? String(subject.examDate) : null,
    current_level: subject?.currentLevel ? String(subject.currentLevel).trim() : null,
    target_grade: subject?.targetGrade ? String(subject.targetGrade).trim() : null,
    weekly_hours: subject?.weeklyHours !== undefined && subject?.weeklyHours !== "" ? Number(subject.weeklyHours) : null,
    weak_topic: subject?.weakTopic ? String(subject.weakTopic).trim() : null
  }));

  if (rows.some((row: { name: string }) => !row.name)) {
    return NextResponse.json({ error: "Every subject needs a name." }, { status: 400 });
  }

  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase!
    .from("subjects")
    .insert(rows)
    .select("id, name, exam_date, current_level, target_grade, weekly_hours, readiness, weak_topic, created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", subjects: data ?? [] });
}
