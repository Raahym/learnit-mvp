import { NextResponse } from "next/server";
import { buildDashboardModel } from "@/lib/workspace-state";
import { getSupabaseAdmin, getUserFromRequest, hasSupabaseServerConfig } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function safeSelect<T>(query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>) {
  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

export async function GET(request: Request) {
  if (!hasSupabaseServerConfig()) {
    return NextResponse.json(
      buildDashboardModel({
        mode: "demo",
        profile: null,
        subjects: [],
        topics: [],
        materials: [],
        sessions: [],
        quizAttempts: [],
        tasks: []
      })
    );
  }

  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin()!;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, onboarding_complete")
    .eq("id", user.id)
    .maybeSingle();

  const profileRecord =
    profile ??
    {
      id: user.id,
      email: user.email ?? null,
      full_name: null,
      onboarding_complete: false
    };

  const [subjects, topics, materials, sessions, quizAttempts, tasks] = await Promise.all([
    safeSelect(
      supabase
        .from("subjects")
        .select("id, name, exam_date, current_level, target_grade, weekly_hours, readiness, weak_topic, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
    ),
    safeSelect(
      supabase
        .from("topics")
        .select("id, subject_id, name, confidence, mastery, retention, coverage_status, last_reviewed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
    ),
    safeSelect(
      supabase
        .from("study_materials")
        .select("id, title, material_type, subject, subject_id, status, concept_count, storage_path, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
    ),
    safeSelect(
      supabase
        .from("study_sessions")
        .select("id, subject, topic, confidence, minutes, readiness_gain, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)
    ),
    safeSelect(
      supabase
        .from("quiz_attempts")
        .select("id, subject, topic, question, selected_answer, correct_answer, is_correct, confidence, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)
    ),
    safeSelect(
      supabase
        .from("study_tasks")
        .select("id, title, reason, task_type, estimated_minutes, priority, scheduled_for, due_at, completed_at, subject_id, topic_id")
        .eq("user_id", user.id)
        .order("scheduled_for", { ascending: true, nullsFirst: false })
        .limit(30)
    )
  ]);

  return NextResponse.json(
    buildDashboardModel({
      mode: "supabase",
      profile: profileRecord,
      subjects,
      topics,
      materials,
      sessions,
      quizAttempts,
      tasks
    })
  );
}
