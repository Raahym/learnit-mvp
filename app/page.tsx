"use client";

import {
  BarChart3,
  BookOpenCheck,
  Brain,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Database,
  FileText,
  FlaskConical,
  GraduationCap,
  Layers3,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
  UserCircle,
  Zap
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient, hasSupabaseBrowserConfig } from "@/lib/supabase-browser";

type AppTab = "command" | "library" | "flashcards" | "quiz" | "plan";
type Session = { id: string; topic: string; gain: number; createdAt: string };
type QuizAttempt = { id: string; selectedAnswer: string; isCorrect: boolean; createdAt: string };
type AuthMode = "login" | "signup";

const subjects = [
  { name: "Physics", readiness: 72, exam: "11 days", risk: "Newton's Laws", color: "teal" },
  { name: "Mathematics", readiness: 64, exam: "18 days", risk: "Integration by Parts", color: "amber" },
  { name: "Chemistry", readiness: 69, exam: "23 days", risk: "Stoichiometry", color: "blue" }
];

const libraryItems = [
  { name: "Mechanics Chapter 4.pdf", type: "Notes", status: "Indexed", concepts: 18 },
  { name: "Physics 2024 Paper 2.pdf", type: "Past paper", status: "Mapped", concepts: 12 },
  { name: "Mark Scheme Forces.docx", type: "Mark scheme", status: "Linked", concepts: 9 },
  { name: "Kinematics Lecture Slides.pptx", type: "Slides", status: "Ready", concepts: 21 }
];

const weakTopics = [
  { name: "Newton's Laws", subject: "Physics", readiness: 48, root: "Acceleration and free-body diagrams", action: "12 targeted questions" },
  { name: "Integration by Parts", subject: "Mathematics", readiness: 54, root: "Choosing u and dv under time pressure", action: "4 worked examples" },
  { name: "Stoichiometry", subject: "Chemistry", readiness: 61, root: "Mole ratio setup", action: "Formula recall drill" }
];

const plan = [
  { time: "08:00", task: "Review 18 flashcards", detail: "Physics formulas due before retention drops" },
  { time: "08:25", task: "Adaptive quiz", detail: "12 mechanics questions with confidence rating" },
  { time: "08:55", task: "Root cause fix", detail: "Acceleration examples from uploaded notes" },
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

const readinessFactors = [
  ["Mastery", 82],
  ["Retention", 68],
  ["Confidence", 91],
  ["Exam coverage", 74]
];

export default function Home() {
  const [tab, setTab] = useState<AppTab>("command");
  const [email, setEmail] = useState("");
  const [examGoal, setExamGoal] = useState("Physics final in 11 days");
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [sessionResult, setSessionResult] = useState("Ready to analyze your next study session.");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [revealedCard, setRevealedCard] = useState(0);
  const [quizChoice, setQuizChoice] = useState("");
  const [analysisState, setAnalysisState] = useState("Idle");
  const [supabaseState, setSupabaseState] = useState("Checking...");
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const readiness = useMemo(() => {
    const bonus = sessions.reduce((sum, session) => sum + session.gain, 0);
    return Math.min(94, 72 + bonus);
  }, [sessions]);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data) => setSupabaseState(data.supabase === "connected" ? "Connected" : "Awaiting keys"))
      .catch(() => setSupabaseState("Check failed"));
  }, []);

  useEffect(() => {
    if (!supabase) {
      setIsAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setIsAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setQuizAttempts([]);
      return;
    }

    loadSavedWorkspace();
  }, [user]);

  async function getAccessToken() {
    if (!supabase) {
      return null;
    }

    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function loadSavedWorkspace() {
    const token = await getAccessToken();
    if (!token) {
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };
    const [sessionResponse, attemptResponse] = await Promise.all([
      fetch("/api/study-session", { headers }),
      fetch("/api/quiz-attempt", { headers })
    ]);

    if (sessionResponse.ok) {
      const data = await sessionResponse.json();
      setSessions((data.sessions ?? []).map((session: any) => ({
        id: session.id,
        topic: session.topic,
        gain: Number(session.readiness_gain ?? 0),
        createdAt: new Date(session.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      })));
    }

    if (attemptResponse.ok) {
      const data = await attemptResponse.json();
      setQuizAttempts((data.attempts ?? []).map((attempt: any) => ({
        id: attempt.id,
        selectedAnswer: attempt.selected_answer,
        isCorrect: Boolean(attempt.is_correct),
        createdAt: new Date(attempt.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      })));
    }
  }

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthMessage(authMode === "signup" ? "Creating account..." : "Signing in...");

    if (!supabase || !hasSupabaseBrowserConfig()) {
      setAuthMessage("Supabase public env vars are missing. Add them to enable real auth.");
      return;
    }

    const request = authMode === "signup"
      ? supabase.auth.signUp({ email: authEmail, password: authPassword })
      : supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    const { data, error } = await request;

    if (error) {
      setAuthMessage(error.message);
      return;
    }

    setUser(data.user ?? null);
    setAuthMessage(authMode === "signup" ? "Account created. Check email confirmation settings if login is blocked." : "Signed in.");
  }

  async function logout() {
    await supabase?.auth.signOut();
    setUser(null);
    setAuthMessage("Signed out.");
  }

  async function joinWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setWaitlistMessage("Saving workspace request...");

    const response = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: "student", examGoal })
    });

    const data = await response.json();
    setWaitlistMessage(data.ok ? "Beta workspace request saved." : data.error);
  }

  async function logSession(topic = "Newton's Laws") {
    setSessionResult("Analyzing session...");
    const token = await getAccessToken();

    const response = await fetch("/api/study-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ subject: "Physics", topic, confidence: 3, minutes: 35 })
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
    setSessionResult(`+${gain}% readiness. ${data.recommendation}`);
  }

  async function chooseQuizAnswer(option: string) {
    setQuizChoice(option);
    const token = await getAccessToken();

    const response = await fetch("/api/quiz-attempt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        subject: "Physics",
        topic: "Newton's Laws",
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
    }
  }

  function analyzeUpload() {
    setAnalysisState("Extracting concepts...");
    window.setTimeout(() => setAnalysisState("18 concepts indexed, 3 weak-topic links created"), 650);
  }

  return (
    <main>
      <nav className="topbar">
        <div className="brand">Learn<span>It</span></div>
        <div className="navlinks">
          <a href="#dashboard">Workspace</a>
          <a href="#engine">Engine</a>
          <a href="#pricing">Pricing</a>
        </div>
        <a className="navAction" href="#join">{user ? "Account" : "Create account"}</a>
      </nav>

      <section className="hero">
        <div className="heroCopy">
          <div className="statusStrip">
            <div className="statusItem" data-state="connected"><Cloud size={16} /><span>Vercel</span><strong>Live production</strong></div>
            <div className="statusItem" data-state={supabaseState === "Connected" ? "connected" : "demo"}><Database size={16} /><span>Supabase</span><strong>{supabaseState}</strong></div>
            <div className="statusItem" data-state="ready"><ShieldCheck size={16} /><span>MVP</span><strong>Working workspace</strong></div>
          </div>
          <p className="eyebrow"><Sparkles size={14} /> AI academic workspace</p>
          <h1>Run your study life from one command center.</h1>
          <p className="lede">
            LearnIt tracks notes, papers, quizzes, flashcards, confidence, retention, and exam readiness in one working workspace. It is built to become the student's academic operating system.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="#dashboard"><Target size={18} /> Open workspace</a>
            <button className="secondaryButton" onClick={() => logSession()}><Zap size={18} /> Analyze session</button>
          </div>
        </div>

        <section className="readinessPanel" aria-label="Exam readiness preview">
          <div className="panelTop"><span>Physics exam</span><strong>11 days left</strong></div>
          <div className="score">{readiness}<span>%</span></div>
          <div className="meter"><span style={{ width: `${readiness}%` }} /></div>
          <div className="factorList">
            {readinessFactors.map(([label, value]) => (
              <div className="factor" key={label as string}>
                <div><span>{label}</span><strong>{value}%</strong></div>
                <i><em style={{ width: `${value}%` }} /></i>
              </div>
            ))}
          </div>
          <div className="panelGrid">
            <div><small>Predicted grade</small><strong>B+</strong></div>
            <div><small>Priority</small><strong>Newton's Laws</strong></div>
            <div><small>Next action</small><strong>12 questions</strong></div>
            <div><small>Cloud sessions</small><strong>{sessions.length}</strong></div>
          </div>
        </section>
      </section>

      <section className="workflow">
        {[
          ["Upload", "Notes, slides, papers, mark schemes"],
          ["Extract", "Concepts, formulas, definitions, question types"],
          ["Practice", "Cards, adaptive quizzes, confidence checks"],
          ["Decide", "Tonight's exact study plan"]
        ].map(([title, copy]) => (
          <article key={title} className="workflowItem"><CheckCircle2 size={18} /><h2>{title}</h2><p>{copy}</p></article>
        ))}
      </section>

      <section className="appShell" id="dashboard">
        <aside className="sidebar">
          <div className="studentCard">
            <GraduationCap size={26} />
            <div><strong>{user ? "Your Semester" : "Demo Semester"}</strong><span>{user?.email ?? "Sign in to save progress"}</span></div>
          </div>
          {[
            ["command", "Command center"],
            ["library", "Content library"],
            ["flashcards", "Flashcards"],
            ["quiz", "Quiz"],
            ["plan", "Study plan"]
          ].map(([key, label]) => (
            <button className={tab === key ? "sideItem active" : "sideItem"} key={key} onClick={() => setTab(key as AppTab)}>{label}</button>
          ))}
        </aside>

        <div className="dashboard">
          <div className="dashHeader">
            <div><p className="eyebrow">Workspace</p><h2>{tab === "command" ? "Study command center" : tab[0].toUpperCase() + tab.slice(1)}</h2></div>
            <button className="iconButton" onClick={() => logSession()}><Zap size={18} /> Log study session</button>
          </div>

          <div className="metrics">
            {subjects.map((subject) => (
              <article className="metric subjectMetric" key={subject.name}>
                <span>{subject.name}</span>
                <strong>{subject.readiness}%</strong>
                <small>{subject.exam} / weak: {subject.risk}</small>
              </article>
            ))}
            <article className="metric"><span>Saved sessions</span><strong>{sessions.length}</strong><small>{user ? "Stored in Supabase" : "Sign in to enable cloud save"}</small></article>
          </div>

          {tab === "command" && (
            <>
              <div className="commandRow">
                <article className="uploadPanel">
                  <UploadCloud size={28} />
                  <div><strong>Content intake</strong><span>Mechanics Chapter 4.pdf ready for analysis</span></div>
                  <button type="button" onClick={analyzeUpload}>Analyze</button>
                </article>
                <article className="coachPanel">
                  <span>AI Coach</span>
                  <strong>Do Newton's Laws first. It unlocks 3 mechanics topics and has the highest exam impact tonight.</strong>
                </article>
              </div>
              <div className="dashGrid">
                <WeakTopicPanel />
                <PlanPanel />
                <SearchPanel />
                <PastPaperPanel />
              </div>
              <div className="sessionResult">{analysisState} / {sessionResult}</div>
            </>
          )}

          {tab === "library" && (
            <div className="tablePanel">
              {libraryItems.map((item) => (
                <div className="libraryRow" key={item.name}>
                  <FileText size={18} />
                  <div><strong>{item.name}</strong><span>{item.type} / {item.concepts} concepts</span></div>
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
              <button className="primaryButton" onClick={() => setRevealedCard((revealedCard + 1) % flashcards.length)}>Next card <ChevronRight size={18} /></button>
            </div>
          )}

          {tab === "quiz" && (
            <div className="practicePanel">
              <h3>{quiz.question}</h3>
              <div className="optionGrid">
                {quiz.options.map((option) => (
                  <button className={quizChoice === option ? "quizOption selected" : "quizOption"} key={option} onClick={() => chooseQuizAnswer(option)}>{option}</button>
                ))}
              </div>
              <div className="sessionResult">
                {quizChoice ? (quizChoice === quiz.answer ? "Correct. Force = mass x acceleration = 2 x 3 = 6 N." : "Not quite. Use F = ma, so 2 x 3 = 6 N.") : "Choose an answer to get feedback."}
              </div>
              <div className="attemptStrip">
                <strong>{quizAttempts.length}</strong>
                <span>{user ? "quiz attempts saved to your workspace" : "quiz attempts ready for cloud save after login"}</span>
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

      <section className="engine" id="engine">
        <div><p className="eyebrow">Product engine</p><h2>Academic memory that turns study data into decisions.</h2></div>
        <div className="engineGrid">
          {[
            [BarChart3, "Exam readiness", "One score built from mastery, retention, confidence, weak topics, and time left."],
            [Layers3, "Content graph", "Every note, paper, mistake, formula, and flashcard links back to concepts."],
            [Brain, "Root cause analysis", "Weaknesses are traced to prerequisite gaps instead of vague warnings."],
            [CalendarCheck, "Adaptive planning", "Tonight's plan changes after every quiz, upload, and study session."]
          ].map(([Icon, title, copy]) => {
            const EngineIcon = Icon as typeof BarChart3;
            return <article className="engineCard" key={String(title)}><EngineIcon size={24} /><h3>{title as string}</h3><p>{copy as string}</p></article>;
          })}
        </div>
      </section>

      <section className="pricing" id="pricing">
        <article><Lock size={20} /><h2>Student</h2><p>Personal academic OS.</p><strong>$9</strong><span>Uploads / cards / quizzes / readiness</span></article>
        <article className="premium"><Sparkles size={20} /><h2>Serious Exam Prep</h2><p>For finals, O/A Levels, SAT, and university exams.</p><strong>$15</strong><span>Past papers / coach / advanced analytics / unlimited subjects</span></article>
      </section>

      <section className="join" id="join">
        <div>
          <p className="eyebrow"><UserCircle size={14} /> Account setup</p>
          <h2>{user ? "Your LearnIt workspace is connected." : "Create a real LearnIt account."}</h2>
          <p>{isAuthReady ? "Supabase auth is loaded in the browser and API routes save progress against your user id." : "Checking auth session..."}</p>
        </div>
        <div className="accountGrid">
          {user ? (
            <div className="accountPanel">
              <strong>{user.email}</strong>
              <span>Saved sessions: {sessions.length} / Quiz attempts: {quizAttempts.length}</span>
              <button type="button" onClick={logout}>Log out</button>
            </div>
          ) : (
            <form onSubmit={handleAuth}>
              <div className="authToggle">
                <button type="button" className={authMode === "signup" ? "active" : ""} onClick={() => setAuthMode("signup")}>Sign up</button>
                <button type="button" className={authMode === "login" ? "active" : ""} onClick={() => setAuthMode("login")}>Login</button>
              </div>
              <input value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} placeholder="student@email.com" type="email" />
              <input value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} placeholder="Password" type="password" minLength={6} />
              <button type="submit">{authMode === "signup" ? "Create account" : "Login"}</button>
              <p>{authMessage || "Use your Supabase Auth project to create a persisted student workspace."}</p>
            </form>
          )}

          <form onSubmit={joinWaitlist}>
            <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@email.com" />
            <input value={examGoal} onChange={(event) => setExamGoal(event.target.value)} placeholder="Exam goal" />
            <button type="submit">Save beta request</button>
            <p>{waitlistMessage || "Optional: capture early-access demand separately from app login."}</p>
          </form>
        </div>
      </section>
    </main>
  );
}

function WeakTopicPanel() {
  return (
    <article className="toolPanel large">
      <div className="panelTitle"><Brain size={18} /> Weak topic detection</div>
      {weakTopics.map((topic) => (
        <div className="topicRow" key={topic.name}>
          <div><strong>{topic.name}</strong><span>{topic.subject} / root cause: {topic.root}</span><small>{topic.action}</small></div>
          <b>{topic.readiness}%</b>
        </div>
      ))}
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
