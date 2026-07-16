"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/useAuth";
import type { DashboardModel } from "@/lib/product-types";

type TruthPageKind = "subjects" | "plan" | "flashcards" | "quizzes" | "progress" | "library" | "mistakes" | "settings";

const copy: Record<TruthPageKind, { title: string; eyebrow: string; empty: string }> = {
  subjects: {
    title: "Subjects",
    eyebrow: "Learning map",
    empty: "Add subjects, exam dates, and topics before LearnIt can plan intelligently."
  },
  plan: {
    title: "Plan",
    eyebrow: "Study tasks",
    empty: "No saved tasks yet. Tasks should come from topics, quiz mistakes, deadlines, and readiness gaps."
  },
  flashcards: {
    title: "Flashcards",
    eyebrow: "Recall",
    empty: "Flashcards need source material or generated cards before this becomes useful."
  },
  quizzes: {
    title: "Quizzes",
    eyebrow: "Diagnostics",
    empty: "No quiz evidence yet. A diagnostic quiz is the first real readiness signal."
  },
  progress: {
    title: "Progress",
    eyebrow: "Readiness",
    empty: "Progress is not trustworthy until LearnIt has study sessions and quiz attempts."
  },
  library: {
    title: "Library",
    eyebrow: "Materials",
    empty: "Upload notes, PDFs, or past papers so future AI generation has real course context."
  },
  mistakes: {
    title: "Mistakes",
    eyebrow: "Weak patterns",
    empty: "Mistake patterns appear after incorrect quiz attempts are saved and grouped by topic."
  },
  settings: {
    title: "Settings",
    eyebrow: "Account",
    empty: "Account and workspace settings will live here as the product matures."
  }
};

function formatDate(dateString: string | null) {
  if (!dateString) return "No date";
  return new Date(dateString).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function TruthPage({ kind }: { kind: TruthPageKind }) {
  const { authorizedFetch, user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardModel | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    authorizedFetch("/api/dashboard")
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok || !data?.ok) {
          setError(data?.error ?? "Could not load workspace data.");
          return;
        }
        setDashboard(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load workspace data.");
      });

    return () => {
      cancelled = true;
    };
  }, [authorizedFetch]);

  const incorrectAttempts = useMemo(
    () => dashboard?.quizAttempts.filter((attempt) => !attempt.is_correct) ?? [],
    [dashboard?.quizAttempts]
  );

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="panel panel-body">
          <p className="eyebrow">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="dashboard-page">
        <p className="form-muted">Loading {copy[kind].title.toLowerCase()}...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header" style={{ marginBottom: 28 }}>
        <p className="eyebrow">{copy[kind].eyebrow}</p>
        <h1>{copy[kind].title}</h1>
        <p>{copy[kind].empty}</p>
      </header>

      {kind === "subjects" && (
        <div className="dashboard-grid-row">
          <div className="panel">
            <div className="panel-header">
              <p className="eyebrow" style={{ margin: 0 }}>Saved subjects</p>
              <Link href="/app/onboarding" style={{ color: "var(--primary)", fontSize: 12 }}>Add from onboarding</Link>
            </div>
            {dashboard.subjects.length === 0 ? (
              <p className="form-muted" style={{ padding: 20 }}>{copy.subjects.empty}</p>
            ) : (
              dashboard.subjects.map((subject) => (
                <div key={subject.id} className="list-row">
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{subject.name}</p>
                    <p style={{ margin: "4px 0 0", color: "var(--fg-3)", fontSize: 12 }}>
                      Exam {formatDate(subject.exam_date)} · target {subject.target_grade ?? "unset"} · {subject.weekly_hours ?? 0}h/week
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="panel">
            <div className="panel-header"><p className="eyebrow" style={{ margin: 0 }}>Topics</p></div>
            {dashboard.topics.length === 0 ? (
              <p className="form-muted" style={{ padding: 20 }}>Topic creation is the next backend step. Current weak-topic fields are not enough for a full study loop.</p>
            ) : (
              dashboard.topics.map((topic) => (
                <div key={topic.id} className="list-row">
                  <p style={{ margin: 0 }}>{topic.name}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {kind === "plan" && (
        <div className="panel">
          <div className="panel-header"><p className="eyebrow" style={{ margin: 0 }}>Open tasks</p></div>
          {dashboard.tasks.length === 0 ? (
            <p className="form-muted" style={{ padding: 20 }}>{copy.plan.empty}</p>
          ) : (
            dashboard.tasks.map((task) => (
              <div key={task.id} className="list-row">
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{task.title}</p>
                  <p style={{ margin: "4px 0 0", color: "var(--fg-3)", fontSize: 12 }}>
                    {task.task_type} · {task.priority} · {task.estimated_minutes ?? "?"} min
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {kind === "quizzes" && (
        <div className="dashboard-grid-row">
          <div className="panel panel-body">
            <p className="eyebrow">Quiz evidence</p>
            <p className="metric-big">{dashboard.quizSummary.total}</p>
            <p className="form-muted">attempts · {dashboard.quizSummary.accuracy ?? 0}% accuracy</p>
          </div>
          <div className="panel">
            <div className="panel-header"><p className="eyebrow" style={{ margin: 0 }}>Recent attempts</p></div>
            {dashboard.quizAttempts.length === 0 ? (
              <p className="form-muted" style={{ padding: 20 }}>{copy.quizzes.empty}</p>
            ) : (
              dashboard.quizAttempts.slice(0, 8).map((attempt) => (
                <div key={attempt.id} className="list-row">
                  <div>
                    <p style={{ margin: 0, fontWeight: 600 }}>{attempt.topic}</p>
                    <p style={{ margin: "4px 0 0", color: "var(--fg-3)", fontSize: 12 }}>
                      {attempt.subject} · {attempt.is_correct ? "correct" : "incorrect"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {kind === "progress" && (
        <div className="dashboard-grid-row">
          <div className="panel panel-body">
            <p className="eyebrow">Readiness confidence</p>
            <p className="metric-big">{dashboard.readinessSummary.score ?? 0}%</p>
            <p className="form-muted">{dashboard.readinessSummary.explanation}</p>
          </div>
          <div className="panel">
            <div className="panel-header"><p className="eyebrow" style={{ margin: 0 }}>Evidence counts</p></div>
            <div className="list-row"><span>Study sessions</span><span className="font-mono">{dashboard.activitySummary.sessionCount}</span></div>
            <div className="list-row"><span>Quiz attempts</span><span className="font-mono">{dashboard.activitySummary.quizAttemptCount}</span></div>
            <div className="list-row"><span>Materials</span><span className="font-mono">{dashboard.activitySummary.materialCount}</span></div>
          </div>
        </div>
      )}

      {kind === "library" && (
        <div className="panel">
          <div className="panel-header"><p className="eyebrow" style={{ margin: 0 }}>Materials</p></div>
          {dashboard.materials.length === 0 ? (
            <p className="form-muted" style={{ padding: 20 }}>{copy.library.empty}</p>
          ) : (
            dashboard.materials.map((material) => (
              <div key={material.id} className="list-row">
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{material.title}</p>
                  <p style={{ margin: "4px 0 0", color: "var(--fg-3)", fontSize: 12 }}>
                    {material.material_type} · {material.status} · {material.subject ?? "No subject"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {kind === "mistakes" && (
        <div className="panel">
          <div className="panel-header"><p className="eyebrow" style={{ margin: 0 }}>Incorrect attempts</p></div>
          {incorrectAttempts.length === 0 ? (
            <p className="form-muted" style={{ padding: 20 }}>{copy.mistakes.empty}</p>
          ) : (
            incorrectAttempts.map((attempt) => (
              <div key={attempt.id} className="list-row">
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{attempt.topic}</p>
                  <p style={{ margin: "4px 0 0", color: "var(--fg-3)", fontSize: 12 }}>
                    Your answer: {attempt.selected_answer ?? "blank"} · Correct: {attempt.correct_answer}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {kind === "flashcards" && (
        <div className="panel panel-body">
          <p className="eyebrow">Flashcard engine</p>
          <p>{copy.flashcards.empty}</p>
          <p className="form-muted">The next real step is saving generated cards to Supabase and adding spaced-repetition reviews.</p>
        </div>
      )}

      {kind === "settings" && (
        <div className="panel panel-body">
          <p className="eyebrow">Signed in</p>
          <h2 style={{ marginTop: 0 }}>{dashboard.profile?.full_name ?? user?.email ?? "Student"}</h2>
          <p className="form-muted">{dashboard.profile?.email ?? user?.email}</p>
          <Button type="button" variant="secondary" onClick={() => (window.location.href = "/app/onboarding")}>
            Revisit onboarding
          </Button>
        </div>
      )}
    </div>
  );
}
