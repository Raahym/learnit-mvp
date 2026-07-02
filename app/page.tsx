"use client";

import {
  BarChart3,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Cloud,
  Database,
  GraduationCap,
  Layers3,
  Lock,
  ShieldCheck,
  Sparkles,
  Target,
  UserCircle,
  Zap
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

const readinessFactors = [
  ["Mastery", 82],
  ["Retention", 68],
  ["Confidence", 91],
  ["Exam coverage", 74]
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [examGoal, setExamGoal] = useState("Physics final in 11 days");
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [supabaseState, setSupabaseState] = useState("Checking...");

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data) => setSupabaseState(data.supabase === "connected" ? "Connected" : "Awaiting keys"))
      .catch(() => setSupabaseState("Check failed"));
  }, []);

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

  return (
    <main>
      <nav className="topbar">
        <div className="brand">Learn<span>It</span></div>
        <div className="navlinks">
          <a href="#engine">Engine</a>
          <a href="#pricing">Pricing</a>
          <a href="#join">Beta waitlist</a>
        </div>
        <div className="navActions">
          <a className="navAction" href="/login">Log in</a>
          <a className="navAction primaryButton" href="/signup">Sign up</a>
        </div>
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
            <a className="primaryButton" href="/app"><Target size={18} /> Open your workspace</a>
            <a className="secondaryButton" href="#engine"><Zap size={18} /> See how it works</a>
          </div>
        </div>

        <section className="readinessPanel" aria-label="Exam readiness preview">
          <div className="panelTop"><span>Sample subject</span><strong>Demo preview</strong></div>
          <div className="score">72<span>%</span></div>
          <div className="meter"><span style={{ width: "72%" }} /></div>
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
            <div><small>Cloud sessions</small><strong>Sign in</strong></div>
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
          <p className="eyebrow"><UserCircle size={14} /> Get started</p>
          <h2>Ready to build your own workspace?</h2>
          <p>Create a real account to save subjects, sessions, and quiz history, or drop your email for the beta waitlist below.</p>
        </div>
        <div className="accountGrid">
          <div className="accountPanel">
            <strong>Your LearnIt workspace</strong>
            <span>Full auth, saved progress, and a personalized dashboard live at /app.</span>
            <a className="primaryButton" href="/signup"><GraduationCap size={16} /> Create account</a>
            <a className="secondaryButton" href="/login">Log in instead</a>
          </div>

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
