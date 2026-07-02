"use client";

import {
  BookOpenCheck,
  Brain,
  CalendarCheck,
  ChevronRight,
  FileText,
  FlaskConical,
  GraduationCap,
  Search,
  UploadCloud,
  Zap
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/useAuth";

type AppTab = "command" | "library" | "flashcards" | "quiz" | "plan";
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

const plan = [
  { time: "08:00", task: "Review flashcards", detail: "Highest-retention-risk cards due before today's session" },
  { time: "08:25", task: "Adaptive quiz", detail: "Mixed questions with a confidence rating on each answer" },
  { time: "08:55", task: "Root cause fix", detail: "Worked examples for your lowest-readiness topic" },
  { time: "09:20", task: "Exam readiness check", detail: "Score recalculates after the session" }
];

const flashcards = [
  { front: "Newton's Second Law", back: "Force equals mass times acceleration. F = ma." },
  { front: "Confidence accuracy", back: "How often your confidence matches whether you were actually correct." },
  { front: "Retention risk", back: "A concept likely to be forgotten soon unless reviewed." }
];

const quiz = {
  question: "A 2 kg object accelerates at 3 m/s^2. What force is required?",
  options: ["5 N", "6 N", "9 N", "12 N"],
  answer: "6 N"
};

function daysUntil(dateString: string | null) {
  if (!dateString) return "No date set";
  const diff = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "Past";
  if (diff === 0) return "Today";
  return `${diff} day${diff === 1 ? "" : "s"}`;
}

export default function Dashboard() {
  const { user, authorizedFetch } = useAuth();
  const [tab, setTab] = useState<AppTab>("command");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [sessionResult, setSessionResult] = useState("Ready to analyze your next study session.");
  const [revealedCard, setRevealedCard] = useState(0);
  const [quizChoice, setQuizChoice] = useState("");
  const [analysisState, setAnalysisState] = useState("Idle");
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionMinutes, setSessionMinutes] = useState("35");
  const [sessionConfidence, setSessionConfidence] = useState("3");
  const [uploadMessage, setUploadMessage] = useState("");
  const [aiMessage, setAiMessage] = useState("AI engine ready.");

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
      setSessions((data.sessions ?? []).map((session: any) => ({
        id: session.id,
        topic: session.topic,
        gain: Number(session.readiness_gain ?? 0),
        createdAt: new Date(session.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      })));
    }

    if (attemptsResponse.ok) {
      const data = await attemptsResponse.json();
      setQuizAttempts((data.attempts ?? []).map((attempt: any) => ({
        id: attempt.id,
        selectedAnswer: attempt.selected_answer,
        isCorrect: Boolean(attempt.is_correct),
        createdAt: new Date(attempt.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      })));
    }

    if (materialsResponse.ok) {
      const data = await materialsResponse.json();
      setMaterials(data.materials ?? []);
    }

    setIsLoadingData(false);
  }

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

  const overallReadiness = useMemo(() => {
    const base = subjects.length
      ? Math.round(subjects.reduce((sum, subject) => sum + subject.readiness, 0) / subjects.length)
      : 50;
    const bonus = sessions.reduce((sum, session) => sum + session.gain, 0);
    return Math.min(97, base + bonus);
  }, [subjects, sessions]);

  const primarySubject = subjects[0]?.name ?? "General";

  async function logSession(topic = sessionTopic || weakTopics[0]?.name || "General review") {
    setSessionResult("Analyzing session...");
    const minutes = Number(sessionMinutes || 35);
    const confidence = Number(sessionConfidence || 3);

    const response = await authorizedFetch("/api/study-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject: primarySubject, topic, confidence, minutes, weakTopic: weakTopics[0]?.name })
    });

    const data = await response.json();
    if (!data.ok) {
      setSessionResult(data.error);
      return;
    }

    const gain = Number(data.readinessGain ?? 4);
    setSessions((current) => [
      { id: crypto.randomUUID(), topic, gain, createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
      ...current
    ].slice(0, 5));
    if (data.readiness !== null && data.readiness !== undefined) {
      setSubjects((current) => current.map((subject) => subject.name === primarySubject ? { ...subject, readiness: Number(data.readiness) } : subject));
    }
    setSessionResult(`+${gain}% readiness. ${data.recommendation}`);
  }

  async function chooseQuizAnswer(option: string) {
    setQuizChoice(option);

    const response = await authorizedFetch("/api/quiz-attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: primarySubject,
        topic: weakTopics[0]?.name ?? "General review",
        question: quiz.question,
        selectedAnswer: option,
        correctAnswer: quiz.answer,
        confidence: 3
      })
    });

    const data = await response.json();
    if (data.ok) {
      setQuizAttempts((current) => [
        { id: crypto.randomUUID(), selectedAnswer: option, isCorrect: option === quiz.answer, createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ...current
      ].slice(0, 8));
      if (data.readiness !== null && data.readiness !== undefined) {
        setSubjects((current) => current.map((subject) => subject.name === primarySubject ? { ...subject, readiness: Number(data.readiness), weak_topic: option === quiz.answer ? subject.weak_topic : weakTopics[0]?.name ?? "General review" } : subject));
      }
    }
  }

  async function uploadMaterial(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadMessage("Uploading material...");
    const form = new FormData();
    form.append("file", file);
    form.append("subject", primarySubject);
    form.append("materialType", file.type.includes("pdf") ? "pdf" : "notes");

    const response = await authorizedFetch("/api/materials", {
      method: "POST",
      body: form
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setUploadMessage(data.error ?? "Upload failed.");
      return;
    }

    setMaterials((current) => [data.material, ...current]);
    setUploadMessage(`${file.name} uploaded and queued for indexing.`);
    event.target.value = "";
  }

  async function runAi(kind: "flashcards" | "quiz" | "explain" | "study-plan") {
    setAiMessage(`Generating ${kind.replace("-", " ")}...`);
    const response = await authorizedFetch(`/api/ai/${kind}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: primarySubject,
        topic: weakTopics[0]?.name ?? sessionTopic ?? "General review",
        question: quiz.question,
        selectedAnswer: quizChoice || "No answer selected",
        correctAnswer: quiz.answer,
        examDate: subjects[0]?.exam_date,
        weeklyHours: subjects[0]?.weekly_hours,
        count: 5
      })
    });
    const data = await response.json();

    if (!response.ok || !data.ok) {
      setAiMessage(data.error ?? "AI route failed.");
      return;
    }

    setAiMessage(`${kind.replace("-", " ")} generated as structured JSON.`);
  }

  return (
    <section className="appShell" id="dashboard">
      <aside className="sidebar">
        <div className="studentCard">
          <GraduationCap size={26} />
          <div>
            <strong>Your Semester</strong>
            <span>{user?.email}</span>
          </div>
        </div>
        {[
          ["command", "Command center"],
          ["library", "Content library"],
          ["flashcards", "Flashcards"],
          ["quiz", "Quiz"],
          ["plan", "Study plan"]
        ].map(([key, label]) => (
          <button className={tab === key ? "sideItem active" : "sideItem"} key={key} onClick={() => setTab(key as AppTab)}>
            {label}
          </button>
        ))}
      </aside>

      <div className="dashboard">
        <div className="dashHeader">
          <div>
            <p className="eyebrow">Workspace</p>
            <h2>{tab === "command" ? "Study command center" : tab[0].toUpperCase() + tab.slice(1)}</h2>
          </div>
          <button className="iconButton" onClick={() => logSession()}>
            <Zap size={18} /> Log study session
          </button>
        </div>

        <div className="metrics">
          {subjects.length === 0 ? (
            <article className="metric">
              <span>No subjects yet</span>
              <strong>--</strong>
              <small><a href="/app/onboarding">Add a subject</a> to see readiness here.</small>
            </article>
          ) : (
            subjects.map((subject) => (
              <article className="metric subjectMetric" key={subject.id}>
                <span>{subject.name}</span>
                <strong>{subject.readiness}%</strong>
                <small>{daysUntil(subject.exam_date)}{subject.weak_topic ? ` / weak: ${subject.weak_topic}` : ""}</small>
              </article>
            ))
          )}
          <article className="metric">
            <span>Overall readiness</span>
            <strong>{overallReadiness}%</strong>
            <small>Average subject readiness plus logged sessions</small>
          </article>
          <article className="metric">
            <span>Saved sessions</span>
            <strong>{sessions.length}</strong>
            <small>Stored in Supabase</small>
          </article>
        </div>

        {tab === "command" && (
          <>
            <div className="commandRow">
              <article className="uploadPanel">
                <UploadCloud size={28} />
                <div>
                  <strong>Content intake</strong>
                  <span>{materials.length} uploaded materials in this workspace</span>
                </div>
                <label className="uploadButton">
                  Upload
                  <input type="file" accept=".pdf,.doc,.docx,.txt,.md,.ppt,.pptx" onChange={uploadMaterial} />
                </label>
              </article>
              <article className="coachPanel">
                <span>AI Coach</span>
                <strong>
                  {weakTopics[0]
                    ? `Do ${weakTopics[0].name} first. It's your lowest-readiness topic in ${weakTopics[0].subject}.`
                    : "Add a subject with a weak topic to get a targeted recommendation."}
                </strong>
              </article>
            </div>
            <div className="dashGrid">
              <WeakTopicPanel weakTopics={weakTopics} isLoading={isLoadingData} />
              <PlanPanel />
              <SearchPanel />
              <PastPaperPanel />
            </div>
            <div className="sessionLogger">
              <input value={sessionTopic} onChange={(event) => setSessionTopic(event.target.value)} placeholder="Topic studied, e.g. Newton's Laws" />
              <input value={sessionMinutes} onChange={(event) => setSessionMinutes(event.target.value)} type="number" min={1} placeholder="Minutes" />
              <select value={sessionConfidence} onChange={(event) => setSessionConfidence(event.target.value)}>
                <option value="1">Confidence 1</option>
                <option value="2">Confidence 2</option>
                <option value="3">Confidence 3</option>
                <option value="4">Confidence 4</option>
                <option value="5">Confidence 5</option>
              </select>
              <button type="button" className="primaryButton" onClick={() => logSession()}>
                <Zap size={16} /> Save session
              </button>
            </div>
            <div className="sessionResult">{analysisState} / {sessionResult} / {uploadMessage || aiMessage}</div>
            <div className="aiActions">
              <button type="button" onClick={() => runAi("flashcards")}>Generate flashcards</button>
              <button type="button" onClick={() => runAi("quiz")}>Generate quiz</button>
              <button type="button" onClick={() => runAi("study-plan")}>Generate study plan</button>
            </div>
          </>
        )}

        {tab === "library" && (
          <div className="tablePanel">
            {materials.length === 0 ? (
              <div className="libraryRow">
                <FileText size={18} />
                <div><strong>No materials uploaded yet</strong><span>Upload PDFs, notes, or slides from the command center.</span></div>
                <b>Empty</b>
              </div>
            ) : materials.map((item) => (
              <div className="libraryRow" key={item.id}>
                <FileText size={18} />
                <div><strong>{item.title}</strong><span>{item.material_type} / {item.concept_count} concepts / {item.subject ?? "General"}</span></div>
                <b>{item.status}</b>
              </div>
            ))}
          </div>
        )}

        {tab === "flashcards" && (
          <div className="practicePanel">
            <div className="flashcard">
              <span>Card {revealedCard + 1} of {flashcards.length}</span>
              <h3>{flashcards[revealedCard].front}</h3>
              <p>{flashcards[revealedCard].back}</p>
            </div>
            <button className="primaryButton" onClick={() => setRevealedCard((revealedCard + 1) % flashcards.length)}>
              Next card <ChevronRight size={18} />
            </button>
          </div>
        )}

        {tab === "quiz" && (
          <div className="practicePanel">
            <h3>{quiz.question}</h3>
            <div className="optionGrid">
              {quiz.options.map((option) => (
                <button className={quizChoice === option ? "quizOption selected" : "quizOption"} key={option} onClick={() => chooseQuizAnswer(option)}>
                  {option}
                </button>
              ))}
            </div>
            <div className="sessionResult">
              {quizChoice ? (quizChoice === quiz.answer ? "Correct. Force = mass x acceleration = 2 x 3 = 6 N." : "Not quite. Use F = ma, so 2 x 3 = 6 N.") : "Choose an answer to get feedback."}
            </div>
            {quizChoice && (
              <button type="button" className="secondaryButton" onClick={() => runAi("explain")}>
                Explain this answer
              </button>
            )}
            <div className="attemptStrip">
              <strong>{quizAttempts.length}</strong>
              <span>quiz attempts saved to your workspace</span>
            </div>
          </div>
        )}

        {tab === "plan" && (
          <div className="dashGrid">
            <PlanPanel />
            <article className="toolPanel">
              <div className="panelTitle"><BookOpenCheck size={18} /> Recent sessions</div>
              {sessions.length === 0 ? <p className="muted">No sessions logged yet.</p> : sessions.map((session) => (
                <div className="planRow" key={session.id}><time>{session.createdAt}</time><div><strong>{session.topic}</strong><span>+{session.gain}% readiness</span></div></div>
              ))}
            </article>
          </div>
        )}
      </div>
    </section>
  );
}

function WeakTopicPanel({ weakTopics, isLoading }: { weakTopics: { name: string; subject: string; readiness: number }[]; isLoading: boolean }) {
  return (
    <article className="toolPanel large">
      <div className="panelTitle"><Brain size={18} /> Weak topic detection</div>
      {isLoading ? (
        <p className="muted">Loading your topics...</p>
      ) : weakTopics.length === 0 ? (
        <p className="muted">No weak topics flagged yet. Add one from onboarding or update a subject.</p>
      ) : (
        weakTopics.map((topic) => (
          <div className="topicRow" key={topic.name}>
            <div><strong>{topic.name}</strong><span>{topic.subject}</span></div>
            <b>{topic.readiness}%</b>
          </div>
        ))
      )}
    </article>
  );
}

function PlanPanel() {
  return (
    <article className="toolPanel">
      <div className="panelTitle"><CalendarCheck size={18} /> Tonight's plan</div>
      {plan.map((item) => (
        <div className="planRow" key={item.time}><time>{item.time}</time><div><strong>{item.task}</strong><span>{item.detail}</span></div></div>
      ))}
    </article>
  );
}

function SearchPanel() {
  return (
    <article className="toolPanel">
      <div className="panelTitle"><Search size={18} /> Search everything</div>
      <div className="searchBox">velocity across notes, formulas, quizzes</div>
      <div className="resultStack"><span>Formula: v = u + at</span><span>Past mistake: used time in minutes</span><span>Card due: velocity vs speed</span></div>
      <p className="muted">Finds related formulas, past mistakes, tutor chats, cards, and exam questions from one concept search.</p>
    </article>
  );
}

function PastPaperPanel() {
  return (
    <article className="toolPanel">
      <div className="panelTitle"><FlaskConical size={18} /> Past paper engine</div>
      <div className="paperBars"><span style={{ height: "76%" }} /><span style={{ height: "52%" }} /><span style={{ height: "88%" }} /><span style={{ height: "38%" }} /><span style={{ height: "64%" }} /></div>
      <p className="muted">Topic frequency, predicted question patterns, and mock drills from papers and mark schemes.</p>
    </article>
  );
}
