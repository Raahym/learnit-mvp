"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/useAuth";
import {
  assignmentsFallback,
  todayPlanFallback,
  weeklyDataFallback,
  type TodayPlanItem
} from "@/lib/mock-dashboard";

type Session = { id: string; topic: string; gain: number; createdAt: string };
type QuizAttempt = { id: string; selectedAnswer: string; isCorrect: boolean; createdAt: string };
type Material = {
  id: string;
  title: string;
  material_type: string;
  subject: string | null;
  status: string;
  concept_count: number;
  created_at: string;
};
type Subject = {
  id: string;
  name: string;
  exam_date: string | null;
  current_level: string | null;
  target_grade: string | null;
  weekly_hours: number | null;
  readiness: number;
  weak_topic: string | null;
};

const typeLabels: Record<TodayPlanItem["type"], string> = {
  review: "Review",
  flashcards: "Flashcards",
  assignment: "Assignment",
  quiz: "Quiz"
};

function daysUntil(dateString: string | null) {
  if (!dateString) return null;
  const diff = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  return diff;
}

function readinessBarColor(value: number) {
  if (value >= 75) return "var(--success)";
  if (value >= 60) return "var(--warning)";
  return "var(--accent)";
}

function readinessTextColor(value: number) {
  if (value >= 75) return "var(--success)";
  if (value >= 60) return "var(--warning)";
  return "var(--accent)";
}

function greetingName(email?: string | null) {
  if (!email) return "there";
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default function DashboardPage() {
  const { user, authorizedFetch } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionMinutes, setSessionMinutes] = useState("35");
  const [sessionConfidence, setSessionConfidence] = useState("3");
  const [sessionResult, setSessionResult] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [aiMessage, setAiMessage] = useState("");

  useEffect(() => {
    loadWorkspace();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadWorkspace() {
    setIsLoadingData(true);

    const [subjectsResponse, sessionsResponse, attemptsResponse, materialsResponse] = await Promise.all([
      authorizedFetch("/api/subjects"),
      authorizedFetch("/api/study-session"),
      authorizedFetch("/api/quiz-attempt"),
      authorizedFetch("/api/materials")
    ]);

    if (subjectsResponse.ok) {
      const data = await subjectsResponse.json();
      setSubjects(data.subjects ?? []);
    }

    if (sessionsResponse.ok) {
      const data = await sessionsResponse.json();
      setSessions(
        (data.sessions ?? []).map((session: { id: string; topic: string; readiness_gain?: number; created_at: string }) => ({
          id: session.id,
          topic: session.topic,
          gain: Number(session.readiness_gain ?? 0),
          createdAt: new Date(session.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }))
      );
    }

    if (attemptsResponse.ok) {
      const data = await attemptsResponse.json();
      setQuizAttempts(
        (data.attempts ?? []).map((attempt: { id: string; selected_answer: string; is_correct: boolean; created_at: string }) => ({
          id: attempt.id,
          selectedAnswer: attempt.selected_answer,
          isCorrect: Boolean(attempt.is_correct),
          createdAt: new Date(attempt.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }))
      );
    }

    if (materialsResponse.ok) {
      const data = await materialsResponse.json();
      setMaterials(data.materials ?? []);
    }

    setIsLoadingData(false);
  }

  const urgentSubject = useMemo(() => {
    if (!subjects.length) return null;
    return [...subjects].sort((a, b) => (daysUntil(a.exam_date) ?? 999) - (daysUntil(b.exam_date) ?? 999))[0];
  }, [subjects]);

  const weakTopics = useMemo(
    () =>
      subjects
        .filter((subject) => subject.weak_topic)
        .sort((a, b) => a.readiness - b.readiness)
        .map((subject) => ({
          name: subject.weak_topic as string,
          subject: subject.name,
          readiness: subject.readiness
        })),
    [subjects]
  );

  const primarySubject = subjects[0]?.name ?? "General";
  const urgentDays = urgentSubject ? daysUntil(urgentSubject.exam_date) : null;
  const todayLabel = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const todayPlan = todayPlanFallback.map((item) => ({
    ...item,
    subject: urgentSubject?.name ?? item.subject
  }));
  const totalMinutes = todayPlan.reduce((sum, task) => sum + task.duration, 0);
  const completedMinutes = todayPlan.filter((task) => completedTasks.includes(task.id)).reduce((sum, task) => sum + task.duration, 0);

  const priorityTopic = weakTopics[0]?.name ?? "your priority topic";
  const prioritySubject = weakTopics[0]?.subject ?? urgentSubject?.name ?? "your subject";

  async function logSession(topic = sessionTopic || priorityTopic) {
    setSessionResult("Saving session...");

    const response = await authorizedFetch("/api/study-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: primarySubject,
        topic,
        confidence: Number(sessionConfidence || 3),
        minutes: Number(sessionMinutes || 35),
        weakTopic: weakTopics[0]?.name
      })
    });

    const data = await response.json();
    if (!data.ok) {
      setSessionResult(data.error);
      return;
    }

    const gain = Number(data.readinessGain ?? 4);
    setSessions((current) =>
      [
        {
          id: crypto.randomUUID(),
          topic,
          gain,
          createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        },
        ...current
      ].slice(0, 5)
    );

    if (data.readiness !== null && data.readiness !== undefined) {
      setSubjects((current) =>
        current.map((subject) =>
          subject.name === primarySubject ? { ...subject, readiness: Number(data.readiness) } : subject
        )
      );
    }

    setSessionResult(`+${gain}% readiness. ${data.recommendation}`);
  }

  async function uploadMaterial(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage("Uploading material...");
    const form = new FormData();
    form.append("file", file);
    form.append("subject", primarySubject);
    form.append("materialType", file.type.includes("pdf") ? "pdf" : "notes");

    const response = await authorizedFetch("/api/materials", { method: "POST", body: form });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setUploadMessage(data.error ?? "Upload failed.");
      return;
    }

    setMaterials((current) => [data.material, ...current]);
    setUploadMessage(`${file.name} uploaded and queued for indexing.`);
    event.target.value = "";
  }

  async function runAi(kind: "flashcards" | "quiz" | "study-plan") {
    setAiMessage(`Generating ${kind.replace("-", " ")}...`);
    const response = await authorizedFetch(`/api/ai/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: primarySubject,
        topic: weakTopics[0]?.name ?? sessionTopic ?? "General review",
        examDate: subjects[0]?.exam_date,
        weeklyHours: subjects[0]?.weekly_hours,
        count: 5
      })
    });
    const data = await response.json();
    setAiMessage(response.ok && data.ok ? `${kind.replace("-", " ")} generated as structured JSON.` : data.error ?? "AI route failed.");
  }

  function toggleTask(id: string) {
    setCompletedTasks((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="dashboard-page">
      <header className="dashboard-header" style={{ marginBottom: 32 }}>
        <p className="eyebrow">{todayLabel}</p>
        <h1>Good morning, {greetingName(user?.email)}.</h1>
        {urgentSubject && urgentDays !== null ? (
          <p>
            Your <strong>{urgentSubject.name}</strong> exam is in{" "}
            <strong style={{ color: "var(--accent)" }}>{urgentDays} day{urgentDays === 1 ? "" : "s"}</strong>. Here&apos;s what matters most today.
          </p>
        ) : subjects.length === 0 ? (
          <p>
            Add a subject in <Link href="/app/onboarding" style={{ color: "var(--primary)" }}>onboarding</Link> to unlock exam-aware recommendations.
          </p>
        ) : (
          <p>Here&apos;s what matters most in your workspace today.</p>
        )}
      </header>

      <div className="dashboard-grid-3">
        <div className="priority-card">
          <p className="font-mono eyebrow" style={{ color: "var(--accent)", marginBottom: 12 }}>
            Today&apos;s priority
          </p>
          <h2>
            Review {priorityTopic} — {sessionMinutes || 15} min
          </h2>
          <p>
            {weakTopics.length > 0 ? (
              <>
                This is your lowest-readiness topic in <strong>{prioritySubject}</strong>. Fixing it before your next exam improves readiness fastest.
              </>
            ) : (
              <>Log a study session or complete a quiz to surface your next priority action.</>
            )}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <Button type="button" onClick={() => logSession()}>
              Start review <ChevronRight size={16} />
            </Button>
            <div className="priority-meta">
              <span>{sessionMinutes || 15} min</span>
              <span>·</span>
              <span>{prioritySubject}</span>
              {urgentDays !== null && (
                <>
                  <span>·</span>
                  <span>Exam in {urgentDays}d</span>
                </>
              )}
            </div>
          </div>
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
                <span className="font-mono">{urgentSubject.readiness}%</span>
              </div>
              <div className="progress-bar">
                <span style={{ width: `${urgentSubject.readiness}%`, background: readinessBarColor(urgentSubject.readiness) }} />
              </div>
              <p style={{ fontSize: 11, color: readinessTextColor(urgentSubject.readiness), marginTop: 8 }}>
                {urgentSubject.readiness >= 75 ? "Exam-ready range" : "Not yet exam-ready"}
              </p>
            </>
          ) : (
            <p style={{ color: "var(--fg-2)", fontSize: 14 }}>No exam date set yet.</p>
          )}
        </div>
      </div>

      <div className="dashboard-grid-row">
        <div className="panel panel-body">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
            <p className="eyebrow">This week&apos;s study time</p>
            <p className="font-mono" style={{ fontSize: 12, color: "var(--fg-2)" }}>
              {Math.round(weeklyDataFallback.reduce((sum, day) => sum + day.minutes, 0) / 60)}h guide
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 64 }}>
            {weeklyDataFallback.map((day) => {
              const pct = Math.min(day.minutes / day.target, 1);
              const isToday = day.day === new Date().toLocaleDateString("en-GB", { weekday: "short" });
              return (
                <div key={day.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ width: "100%", height: 48, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <div
                      style={{
                        width: "100%",
                        height: `${pct * 48}px`,
                        borderRadius: 2,
                        background: isToday ? "var(--primary)" : day.minutes >= day.target ? "var(--success)" : "var(--line-2)"
                      }}
                    />
                  </div>
                  <span className="font-mono" style={{ fontSize: 10, color: isToday ? "var(--primary)" : "var(--fg-3)" }}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel panel-body">
          <p className="eyebrow" style={{ marginBottom: 16 }}>
            Today
          </p>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-3)", marginBottom: 6 }}>
              <span>Tasks done</span>
              <span className="font-mono">
                {completedTasks.length}/{todayPlan.length}
              </span>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${(completedTasks.length / todayPlan.length) * 100}%`, background: "var(--primary)" }} />
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--fg-3)", marginBottom: 6 }}>
              <span>Minutes</span>
              <span className="font-mono">
                {completedMinutes}/{totalMinutes}
              </span>
            </div>
            <div className="progress-bar">
              <span style={{ width: `${totalMinutes ? (completedMinutes / totalMinutes) * 100 : 0}%`, background: "var(--success)" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid-row">
        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow" style={{ margin: 0 }}>
              Today&apos;s plan
            </p>
            <span className="form-muted" style={{ fontSize: 12 }}>
              Planner preview
            </span>
          </div>
          {todayPlan.map((task) => {
            const done = completedTasks.includes(task.id);
            return (
              <div key={task.id} className="list-row" style={{ opacity: done ? 0.55 : 1 }}>
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  aria-label={done ? "Mark incomplete" : "Mark complete"}
                  style={{
                    width: 16,
                    height: 16,
                    marginTop: 2,
                    borderRadius: 4,
                    border: done ? "1px solid var(--success)" : "1px solid var(--line-2)",
                    background: done ? "var(--success)" : "transparent",
                    cursor: "pointer",
                    flexShrink: 0
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "var(--primary-light)",
                        color: "var(--primary)"
                      }}
                    >
                      {typeLabels[task.type]}
                    </span>
                    {task.priority === "critical" && (
                      <span className="font-mono" style={{ fontSize: 10, color: "var(--accent)" }}>
                        urgent
                      </span>
                    )}
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 14, fontWeight: 500, textDecoration: done ? "line-through" : "none" }}>
                    {task.title}
                  </p>
                  <p className="font-mono" style={{ margin: "4px 0 0", fontSize: 11, color: "var(--fg-3)" }}>
                    {task.time} · {task.duration} min · {task.subject}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow" style={{ margin: 0 }}>
              Weak topics
            </p>
          </div>
          {isLoadingData ? (
            <p className="form-muted" style={{ padding: 20 }}>
              Loading your topics...
            </p>
          ) : weakTopics.length === 0 ? (
            <p className="form-muted" style={{ padding: 20 }}>
              No weak topics flagged yet. Add one from onboarding or log quiz attempts.
            </p>
          ) : (
            weakTopics.slice(0, 5).map((topic) => (
              <div key={`${topic.subject}-${topic.name}`} style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{topic.name}</p>
                  <span className="font-mono" style={{ fontSize: 11, color: "var(--accent)" }}>
                    {topic.readiness}%
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 11, color: "var(--fg-3)" }}>{topic.subject}</p>
                <div className="progress-bar" style={{ marginTop: 8 }}>
                  <span style={{ width: `${topic.readiness}%`, background: "var(--accent)" }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="dashboard-grid-row">
        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow" style={{ margin: 0 }}>
              Exam readiness
            </p>
          </div>
          {subjects.length === 0 ? (
            <p className="form-muted" style={{ padding: 20 }}>
              <Link href="/app/onboarding" style={{ color: "var(--primary)" }}>
                Add a subject
              </Link>{" "}
              to see readiness here.
            </p>
          ) : (
            subjects.map((subject) => (
              <div key={subject.id} className="list-row">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 }} />
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{subject.name}</p>
                    {daysUntil(subject.exam_date) !== null && (
                      <span className="font-mono" style={{ marginLeft: "auto", fontSize: 11, color: "var(--fg-3)" }}>
                        {daysUntil(subject.exam_date)}d
                      </span>
                    )}
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${subject.readiness}%`, background: readinessBarColor(subject.readiness) }} />
                  </div>
                </div>
                <span className="font-mono" style={{ fontSize: 14, fontWeight: 500, color: readinessTextColor(subject.readiness), width: 40, textAlign: "right" }}>
                  {subject.readiness}%
                </span>
              </div>
            ))
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <p className="eyebrow" style={{ margin: 0 }}>
              Due soon
            </p>
            <span className="form-muted" style={{ fontSize: 12 }}>
              Planner preview
            </span>
          </div>
          {assignmentsFallback.map((assignment) => (
            <div key={assignment.id} style={{ padding: "12px 20px", borderTop: "1px solid var(--line)" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <span
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    width: 24,
                    textAlign: "center",
                    color: assignment.daysUntilDue <= 3 ? "var(--accent)" : assignment.daysUntilDue <= 7 ? "var(--warning)" : "var(--fg-3)"
                  }}
                >
                  {assignment.daysUntilDue}d
                </span>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{assignment.title}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--fg-3)" }}>{assignment.subject}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="dashboard-quick-actions">
        <h3>Quick actions</h3>
        <p className="form-muted" style={{ margin: "0 0 12px" }}>
          {materials.length} materials · {sessions.length} sessions · {quizAttempts.length} quiz attempts saved in Supabase
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
          <Button type="button" variant="secondary" onClick={() => runAi("flashcards")}>
            Generate flashcards
          </Button>
          <Button type="button" variant="secondary" onClick={() => runAi("quiz")}>
            Generate quiz
          </Button>
          <Button type="button" variant="secondary" onClick={() => runAi("study-plan")}>
            Generate study plan
          </Button>
        </div>
        {(sessionResult || uploadMessage || aiMessage) && (
          <div className="status-message">{[sessionResult, uploadMessage, aiMessage].filter(Boolean).join(" · ")}</div>
        )}
      </section>
    </div>
  );
}
