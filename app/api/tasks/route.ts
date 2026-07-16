import { NextResponse } from "next/server";
import { z } from "zod";
import { logServerError, parseJson, rateLimit, safeError, shortText } from "@/lib/api-safety";
import { getSupabaseAdmin, getUserIdFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const taskSchema = z.object({
  title: shortText(180),
  reason: z.string().trim().max(500).optional().nullable(),
  taskType: z.enum(["setup", "review", "quiz", "flashcards", "upload", "assignment"]).default("review"),
  estimatedMinutes: z.coerce.number().int().min(1).max(720).optional().nullable(),
  priority: z.enum(["low", "normal", "high", "critical"]).default("normal"),
  scheduledFor: z.string().trim().max(40).optional().nullable(),
  dueAt: z.string().trim().max(80).optional().nullable(),
  subjectId: z.string().uuid().optional().nullable(),
  topicId: z.string().uuid().optional().nullable()
});

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
    logServerError("tasks.select", error);
    return safeError("Tasks could not be loaded.");
  }

  return NextResponse.json({ ok: true, mode: "supabase", tasks: data ?? [] });
}

export async function POST(request: Request) {
  const limited = rateLimit(request, { key: "tasks:post", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const parsed = await parseJson(request, taskSchema);
  if (parsed.error) return parsed.error;
  const body = parsed.data;

  if (!hasSupabaseServerConfig()) {
    return NextResponse.json({ ok: true, mode: "demo" });
  }

  const supabase = getSupabaseAdmin()!;
  const { data, error } = await supabase
    .from("study_tasks")
    .insert({
      user_id: userId,
      title: body.title,
      reason: body.reason || null,
      task_type: body.taskType,
      estimated_minutes: body.estimatedMinutes ?? null,
      priority: body.priority,
      scheduled_for: body.scheduledFor || null,
      due_at: body.dueAt || null,
      subject_id: body.subjectId || null,
      topic_id: body.topicId || null
    })
    .select("id, title, reason, task_type, estimated_minutes, priority, scheduled_for, due_at, completed_at, subject_id, topic_id")
    .single();

  if (error) {
    logServerError("tasks.insert", error);
    return safeError("Task could not be saved.");
  }

  return NextResponse.json({ ok: true, mode: "supabase", task: data });
}
