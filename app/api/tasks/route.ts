import { NextResponse } from "next/server";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo", tasks: [] });
  }

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("study_tasks")
    .select("id, title, reason, task_type, estimated_minutes, priority, scheduled_for, due_at, completed_at, subject_id, topic_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", tasks: data ?? [] });
}

export async function POST(request: Request) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const title = String(body?.title ?? "").trim();
  if (!title) {
    return NextResponse.json({ error: "Task title is required." }, { status: 400 });
  }

  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("study_tasks")
    .insert({
      user_id: userId,
      title,
      reason: body?.reason || null,
      task_type: body?.taskType ?? "review",
      estimated_minutes: body?.estimatedMinutes ? Number(body.estimatedMinutes) : null,
      priority: body?.priority ?? "normal",
      scheduled_for: body?.scheduledFor || null,
      due_at: body?.dueAt || null,
      subject_id: body?.subjectId || null,
      topic_id: body?.topicId || null
    })
    .select("id, title, reason, task_type, estimated_minutes, priority, scheduled_for, due_at, completed_at, subject_id, topic_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, mode: "supabase", task: data });
}
