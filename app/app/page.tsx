"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/useAuth";
import type { DashboardModel, SubjectRecord } from "@/lib/product-types";

function daysUntil(dateString: string | null) {
  if (!dateString) return null;
  const diff = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff >= 0 && Number.isFinite(diff) ? diff : null;
}

function greetingName(email?: string | null) {
  if (!email) return "there";
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

function readinessBarColor(value: number) {
  if (value >= 75) return "var(--success)";
  if (value >= 60) return "var(--warning)";
  return "var(--accent)";
}

function nearestSubject(subjects: SubjectRecord[]) {
  return [...subjects].sort((a, b) => (daysUntil(a.exam_date) ?? 999) - (daysUntil(b.exam_date) ?? 999))[0] ?? null;
}

export default function DashboardPage() {
  const { user, authorizedFetch } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardModel | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionMinutes, setSessionMinutes] = useState("25");
  const [sessionConfidence, setSessionConfidence] = useState("3");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadDashboard() {
    setIsLoadingData(true);
    setError("");
    const response = await authorizedFetch("/api/dashboard");
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      setError(data?.error ?? "Could not load your workspace.");
      setIsLoadingData(false);
      return;
    }
    setDashboard(data);
    setIsLoadingData(false);
  }

  const urgentSubject = useMemo(() => nearestSubject(dashboard?.subjects ?? []), [dashboard?.subjects]);
  const urgentDays = urgentSubject ? daysUntil(urgentSubject.exam_date) : null;
  const primarySubject = urgentSubject ?? dashboard?.subjects[0] ?? null;
  const todayLabel = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const evidenceCount = (dashboard?.activitySummary.sessionCount ?? 0) + (dashboard?.activitySummary.quizAttemptCount ?? 0);

  async function logSession(topic = sessionTopic.trim()) {
    if (!primarySubject) {
      setStatusMessage("Add a subject before logging study sessions.");
      return;
    }
    if (!topic) {
      setStatusMessage("Add the topic you actually studied first.");
      return;
    }

    setStatusMessage("Saving session...");
    const response = await authorizedFetch("/api/study-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: primarySubject.name,
        topic,
        confidence: Number(sessionConfidence || 3),
        minutes: Number(sessionMinutes || 25),
        weakTopic: dashboard?.weakTopics[0]?.name
      })
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      setStatusMessage(data?.error ?? "Session could not be saved.");
      return;
    }

    setSessionTopic("");
    setStatusMessage(`Saved ${sessionMinutes || 25} minutes on ${topic}.`);
    await loadDashboard();
  }

  async function uploadMaterial(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!primarySubject) {
      setStatusMessage("Add a subject before uploading material.");
      event.target.value = "";
      return;
    }

    setStatusMessage("Uploading material...");
    const form = new FormData();
    form.append("file", file);
    form.append("subject", primarySubject.name);
    form.append("materialType", file.type.includes("pdf") ? "pdf" : "notes");

    const response = await authorizedFetch("/api/materials", { method: "POST", body: form });
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      setStatusMessage(data?.error ?? "Upload failed.");
      return;
    }

    setStatusMessage(`${file.name} uploaded. Processing/indexing still needs the worker phase.`);
    event.target.value = "";
    await loadDashboard();
  }

  async function runAi(kind: "flashcards" | "quiz" | "study-plan") {
    if (!primarySubject) {
      setStatusMessage("Add a subject before using AI generation.");
      return;
    }
    setStatusMessage(`Generating ${kind.replace("-", " ")}...`);
    const response = await authorizedFetch(`/api/ai/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: primarySubject.name,
        topic: dashboard?.weakTopics[0]?.name ?? (sessionTopic.trim() || "General review"),
        examDate: primarySubject.exam_date,
        weeklyHours: primarySubject.weekly_hours,
        count: 5
      })
    });
    const data = await response.json().catch(() => null);
    setStatusMessage(response.ok && data?.ok ? `${kind.replace("-", " ")} generated as structured JSON.` : data?.error ?? "AI route failed.");
  }

  if (isLoadingData) {
    return (
      <div className="dashboard-page">
        <p className="form-muted">Loading your workspace...</p>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="dashboard-page">
        <div className="panel panel-body">
          <p className="eyebrow">Workspace error</p>
          <p>{error || "Dashboard unavailable."}</p>
          <Button type="button" onClick={loadDashboard}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header" style={{ marginBottom: 32 }}>
        <p className="eyebrow">{todayLabel}</p>
        <h1>Good morning, {greetingName(user?.email)}.</h1>
        <p>
          {dashboard.workspaceState === "onboarding_required"
            ? "Finish setup so LearnIt can stop guessing and start planning."
            : `Workspace state: ${dashboard.stateLabel}. ${dashboard.readinessSummary.explanation}`}
        </p>
      </header>

      <div className="dashboard-grid-3">
        <div className="priority-card">
          <p className="font-mono eyebrow" style={{ color: "var(--accent)", marginBottom: 12 }}>
            {dashboard.primaryAction.label}
          </p>
          <h2>{dashboard.primaryAction.title}</h2>
          <p>{dashboard.primaryAction.reason}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <Button type="button" onClick={() => (window.location.href = dashboard.primaryAction.href)}>
              {dashboard.primaryAction.cta} <ChevronRight size={16} />
            </Button>
            <div className="priority-meta">
              <span>{dashboard.primaryAction.evidence}</span>
            </div>
          </div>
        </div>

        <div className="panel panel-body">
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Evidence
          </p>
          <p className="metric-big">{evidenceCount}</p>
          <p style={{ color: "var(--fg-2)", fontSize: 14, margin: "4px 0 16px" }}>study + quiz records</p>
          <div style={{ display: "grid", gap: 8, fontSize: 12, color: "var(--fg-3)" }}>
            <span>{dashboard.activitySummary.sessionCount} sessions</span>
            <span>{dashboard.activitySummary.quizAttemptCount} quiz attempts</span>
            <span>{dashboard.activitySummary.materialCount} materials</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-row">
        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow" style={{ margin: 0 }}>
              Setup checklist
            </p>
            <span className="form-muted" style={{ fontSize: 12 }}>
              truth-based
            </span>
          </div>
          {dashboard.setupChecklist.map((item) => (
            <Link key={item.id} href={item.href} className="list-row" style={{ textDecoration: "none", color: "inherit" }}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: item.done ? "1px solid var(--success)" : "1px solid var(--line-2)",
                  background: item.done ? "var(--success)" : "transparent",
                  flexShrink: 0
                }}
              />
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--fg-3)" }}>{item.detail}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="panel panel-body">
          <p className="eyebrow" style={{ marginBottom: 12 }}>
            Nearest exam
          </p>
          {urgentSubject && urgentDays !== null ? (
            <>
              <p className="metric-big">{urgentDays}</p>
              <p style={{ color: "var(--fg-2)", fontSize: 14, margin: "4px 0 0" }}>
                day{urgentDays === 1 ? "" : "s"} until exam
              </p>
              <p style={{ color: "var(--fg-3)", fontSize: 12, margin: "4px 0 16px" }}>{urgentSubject.name}</p>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-3)", marginBottom: 6 }}>
                <span>Readiness</span>
                <span className="font-mono">{dashboard.readinessSummary.score ?? 0}%</span>
              </div>
              <div className="progress-bar">
                <span
                  style={{
                    width: `${dashboard.readinessSummary.score ?? 0}%`,
                    background: readinessBarColor(dashboard.readinessSummary.score ?? 0)
                  }}
                />
              </div>
              <p style={{ fontSize: 11, color: "var(--fg-3)", marginTop: 8 }}>{dashboard.readinessSummary.explanation}</p>
            </>
          ) : (
            <p style={{ color: "var(--fg-2)", fontSize: 14 }}>No exam date set yet.</p>
          )}
        </div>
      </div>

      <div className="dashboard-grid-row">
        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow" style={{ margin: 0 }}>
              Subjects
            </p>
            <Link href="/app/subjects" className="form-muted" style={{ fontSize: 12, color: "var(--primary)" }}>
              Manage
            </Link>
          </div>
          {dashboard.subjects.length === 0 ? (
            <p className="form-muted" style={{ padding: 20 }}>
              No subjects yet. <Link href="/app/onboarding">Start onboarding</Link>.
            </p>
          ) : (
            dashboard.subjects.map((subject) => (
              <div key={subject.id} className="list-row">
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{subject.name}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--fg-3)" }}>
                    {subject.exam_date ? `${daysUntil(subject.exam_date) ?? "Past"} days to exam` : "No exam date"} · {subject.target_grade ?? "No target grade"}
                  </p>
                </div>
                <span className="font-mono" style={{ fontSize: 12, color: "var(--fg-3)" }}>{subject.readiness}%</span>
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow" style={{ margin: 0 }}>
              Weak topics
            </p>
          </div>
          {dashboard.weakTopics.length === 0 ? (
            <p className="form-muted" style={{ padding: 20 }}>No weak topics are trusted yet. Add topics and complete quizzes first.</p>
          ) : (
            dashboard.weakTopics.slice(0, 5).map((topic) => (
              <div key={`${topic.subject}-${topic.name}`} style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{topic.name}</p>
                  <span className="font-mono" style={{ fontSize: 11, color: "var(--accent)" }}>{topic.readiness}%</span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--fg-3)" }}>{topic.subject} · {topic.evidence}</p>
              </div>
            ))
          )}
        </div>
      </div>

      <section className="dashboard-quick-actions">
        <h3>Quick actions</h3>
        <p className="form-muted" style={{ margin: "0 0 12px" }}>
          These save real records. They stay limited until topics, diagnostics, and material processing are complete.
        </p>
        <div className="quick-actions-grid">
          <Input value={sessionTopic} onChange={(event) => setSessionTopic(event.target.value)} placeholder="Topic studied" />
          <Input value={sessionMinutes} onChange={(event) => setSessionMinutes(event.target.value)} type="number" min={1} placeholder="Minutes" />
          <select className="input" value={sessionConfidence} onChange={(event) => setSessionConfidence(event.target.value)}>
            {[1, 2, 3, 4, 5].map((level) => (
              <option key={level} value={level}>
                Confidence {level}
              </option>
            ))}
          </select>
          <Button type="button" onClick={() => logSession()}>
            Save session
          </Button>
        </div>
        <div className="quick-actions-buttons">
          <label className="btn btn-secondary" style={{ cursor: "pointer" }}>
            Upload material
            <input type="file" accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx" onChange={uploadMaterial} style={{ display: "none" }} />
          </label>
          <Button type="button" variant="secondary" onClick={() => runAi("flashcards")}>Generate flashcards</Button>
          <Button type="button" variant="secondary" onClick={() => runAi("quiz")}>Generate quiz</Button>
          <Button type="button" variant="secondary" onClick={() => runAi("study-plan")}>Generate study plan</Button>
        </div>
        {statusMessage && <div className="status-message">{statusMessage}</div>}
      </section>
    </div>
  );
}
