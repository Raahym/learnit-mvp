import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo", topics: [] });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("topics")
    .select("id, subject_id, name, confidence, mastery, retention, coverage_status, last_reviewed_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", topics: data ?? [] });
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Topic name is required." }, { status: 400 });
  }

  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("topics")
    .insert({
      user_id: userId,
      subject_id: body?.subjectId || null,
      name,
      confidence: Number(body?.confidence ?? 0),
      mastery: Number(body?.mastery ?? 0),
      retention: Number(body?.retention ?? 0),
      coverage_status: body?.coverageStatus ?? "not_started"
    })
    .select("id, subject_id, name, confidence, mastery, retention, coverage_status, last_reviewed_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", topic: data });
}
