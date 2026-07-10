"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const features = [
  {
    label: "Readiness over guesswork",
    body: "LearnIt tracks mastery, retention, confidence, and coverage separately — then combines them into an honest readiness score for each exam."
  },
  {
    label: "Mistake patterns, not one-off wrong answers",
    body: "LearnIt records what you got wrong, how often, and why — then resurfaces that exact error type until you stop making it."
  },
  {
    label: "AI that tracks what happens after generation",
    body: "Every generated quiz and flashcard connects to your actual performance, not just a one-time output."
  },
  {
    label: "Spaced repetition that understands context",
    body: "Reviews are scheduled from quiz performance and retention curves — not just when you last pressed easy."
  },
  {
    label: "A study plan that adapts",
    body: "Miss a session and the plan recalculates. Improve faster than expected and your schedule shifts to reflect it."
  },
  {
    label: "Materials connected to what you study",
    body: "Upload notes and past papers. LearnIt links them to topics and uses them to generate quizzes, summaries, and flashcards."
  }
];

const steps = [
  {
    num: "01",
    title: "Add your subjects and exams",
    body: "Set up your modules, upload materials, and record exam dates. LearnIt immediately has context for your academic situation."
  },
  {
    num: "02",
    title: "Study with built-in intelligence",
    body: "Take quizzes and flashcard sessions that get harder where you need it most. Every interaction refines your profile."
  },
  {
    num: "03",
    title: "Get a clear next action every day",
    body: "Open the app and see exactly what to study, why it matters, how long it will take, and which exam it supports."
  }
];

const faqs = [
  {
    q: "Can I use LearnIt for any subject?",
    a: "Yes. LearnIt works with any academic subject where you can study, quiz yourself, or create flashcards."
  },
  {
    q: "How does AI generation work?",
    a: "You upload study materials. LearnIt extracts key concepts and generates quiz questions, flashcards, and summaries from your own content."
  },
  {
    q: "What is the difference between mastery and confidence?",
    a: "Confidence is how certain you feel. Mastery is how accurately you answer questions. The gap between them is one of the most useful things LearnIt shows you."
  },
  {
    q: "Does LearnIt replace my existing study materials?",
    a: "No. It organises and connects them — adding intelligence about which parts matter most and how well you've learned them."
  }
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [examGoal, setExamGoal] = useState("Final exams this semester");
  const [waitlistMessage, setWaitlistMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [billingAnnual, setBillingAnnual] = useState(true);

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .catch(() => null);
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
    <main style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Logo href="/" />
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
            <a href="#faq">FAQ</a>
          </div>
          <div className="landing-nav-actions">
            <Link href="/login" className="btn btn-ghost" style={{ minHeight: 36, padding: "0 12px", fontSize: 14 }}>
              Sign in
            </Link>
            <Link href="/signup" className="btn btn-primary" style={{ minHeight: 36, padding: "0 16px", fontSize: 14 }}>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            <span>AI-powered academic system</span>
          </div>
          <h1>
            Know what to
            <br />
            <em>study next.</em>
          </h1>
          <p className="landing-lede">
            LearnIt connects your study materials, quiz performance, mistakes, and exam dates into one system — so you always know which topic needs your attention and why.
          </p>
          <div className="landing-hero-actions">
            <Link href="/signup" className="btn btn-primary" style={{ padding: "12px 24px" }}>
              Start for free
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: "12px 24px" }}>
              Sign in to continue
            </Link>
          </div>
          <p className="landing-fine-print">No credit card · Free plan available · 2 min setup</p>

          <div className="landing-preview" aria-label="Dashboard preview">
            <div style={{ background: "var(--surface-3)", borderBottom: "1px solid var(--line)", padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(179,28,28,0.4)" }} />
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(154,93,8,0.4)" }} />
                <span style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(39,102,73,0.4)" }} />
              </div>
              <div style={{ flex: 1, maxWidth: 280, background: "var(--surface-2)", borderRadius: 4, padding: "4px 12px" }}>
                <span className="font-mono" style={{ fontSize: 11, color: "var(--fg-3)" }}>
                  app.learnit.io/dashboard
                </span>
              </div>
            </div>
            <div style={{ display: "flex", height: 288, overflow: "hidden" }}>
              <div style={{ width: 176, background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-line)", padding: 12, flexShrink: 0 }}>
                {["Today", "Subjects", "Plan", "Flashcards"].map((item, i) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 4, background: i === 0 ? "var(--sidebar-surface)" : "transparent", marginBottom: 4 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 2, background: i === 0 ? "var(--primary)" : "rgba(122,113,104,0.3)" }} />
                    <span style={{ fontSize: 11, color: i === 0 ? "var(--sidebar-active)" : "var(--sidebar-muted)" }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, padding: 20, background: "var(--bg)" }}>
                <p className="font-mono eyebrow" style={{ marginBottom: 4 }}>Thursday, 10 July</p>
                <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Good morning. Midterm in 9 days.</p>
                <div style={{ background: "var(--accent-light)", border: "1px solid rgba(188,79,21,0.25)", borderRadius: 6, padding: 14, marginBottom: 12 }}>
                  <p className="font-mono" style={{ fontSize: 9, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Today&apos;s priority</p>
                  <p style={{ fontWeight: 600, fontSize: 13, margin: "0 0 4px" }}>Review separation of variables — 15 min</p>
                  <p style={{ fontSize: 11, color: "var(--fg-2)", margin: 0 }}>4 errors in recent quizzes. Fixing this improves readiness by ~8%.</p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                  {[
                    { label: "Readiness", value: "64%", color: "var(--warning)" },
                    { label: "Due reviews", value: "18", color: "var(--primary)" },
                    { label: "Until exam", value: "9", color: "var(--accent)" }
                  ].map((stat) => (
                    <div key={stat.label} style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 4, padding: 8 }}>
                      <p className="font-mono" style={{ fontSize: 18, fontWeight: 500, color: stat.color, margin: 0 }}>{stat.value}</p>
                      <p style={{ fontSize: 10, color: "var(--fg-3)", margin: "2px 0 0" }}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section">
        <div className="landing-section-inner">
          <p className="eyebrow">How it works</p>
          <h2>From materials to exam readiness, in one system</h2>
          <div className="landing-grid-3" style={{ marginTop: 48 }}>
            {steps.map((step) => (
              <div key={step.num}>
                <p className="landing-step-num">{step.num}</p>
                <h3 style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 600 }}>{step.title}</h3>
                <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 14, lineHeight: 1.6 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="landing-section surface">
        <div className="landing-section-inner">
          <p className="eyebrow">Features</p>
          <h2>Built around how students actually learn</h2>
          <p style={{ color: "var(--fg-2)", maxWidth: "36rem", marginBottom: 48, lineHeight: 1.6 }}>
            Every decision is designed around the specific problem of exam preparation — not generic productivity.
          </p>
          <div className="landing-feature-grid">
            {features.map((feature) => (
              <div key={feature.label}>
                <h3 style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 600 }}>{feature.label}</h3>
                <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 14, lineHeight: 1.6 }}>{feature.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="landing-section surface">
        <div className="landing-section-inner">
          <p className="eyebrow">Pricing</p>
          <h2>Simple, honest pricing</h2>
          <p style={{ color: "var(--fg-2)", maxWidth: "36rem", marginBottom: 32 }}>
            The free plan is genuinely useful. Premium adds adaptive plans, advanced analysis, and unlimited AI generation.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
            <button type="button" className="btn btn-ghost" onClick={() => setBillingAnnual(false)} style={{ fontSize: 14, color: billingAnnual ? "var(--fg-2)" : "var(--fg)" }}>
              Monthly
            </button>
            <button
              type="button"
              aria-label="Toggle annual billing"
              onClick={() => setBillingAnnual(!billingAnnual)}
              style={{
                width: 40,
                height: 20,
                borderRadius: 999,
                border: 0,
                background: billingAnnual ? "var(--primary)" : "var(--line-2)",
                position: "relative",
                cursor: "pointer"
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  left: billingAnnual ? 20 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#fff",
                  transition: "left 0.15s"
                }}
              />
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setBillingAnnual(true)} style={{ fontSize: 14, color: billingAnnual ? "var(--fg)" : "var(--fg-2)" }}>
              Annual
            </button>
            {billingAnnual && (
              <span className="font-mono" style={{ fontSize: 11, color: "var(--success)", background: "var(--success-light)", padding: "2px 8px", borderRadius: 4 }}>
                Save 30%
              </span>
            )}
          </div>
          <div className="landing-grid-2" style={{ maxWidth: "40rem" }}>
            <div className="panel" style={{ padding: 28 }}>
              <p style={{ fontWeight: 600, margin: "0 0 4px" }}>Free</p>
              <p style={{ color: "var(--fg-3)", fontSize: 14, margin: "0 0 20px" }}>Everything to get started</p>
              <p style={{ margin: "0 0 24px" }}>
                <span className="font-serif" style={{ fontSize: 36 }}>£0</span>
                <span style={{ color: "var(--fg-3)", fontSize: 14, marginLeft: 4 }}>forever</span>
              </p>
              <Link href="/signup" className="btn btn-secondary btn-full">
                Start free
              </Link>
            </div>
            <div className="panel" style={{ padding: 28, borderColor: "var(--primary)", background: "rgba(238,242,255,0.3)" }}>
              <p style={{ fontWeight: 600, margin: "0 0 4px" }}>Premium</p>
              <p style={{ color: "var(--fg-3)", fontSize: 14, margin: "0 0 20px" }}>The full intelligence system</p>
              <p style={{ margin: "0 0 24px" }}>
                <span className="font-serif" style={{ fontSize: 36 }}>£{billingAnnual ? "7" : "10"}</span>
                <span style={{ color: "var(--fg-3)", fontSize: 14, marginLeft: 4 }}>/ month</span>
              </p>
              <Link href="/signup" className="btn btn-primary btn-full">
                Start 14-day trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="landing-section">
        <div className="landing-section-inner landing-grid-2">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>Questions worth asking</h2>
          </div>
          <div>
            {faqs.map((faq, index) => (
              <div key={faq.q} style={{ borderBottom: "1px solid var(--line)" }}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "16px 0",
                    border: 0,
                    background: "transparent",
                    cursor: "pointer",
                    textAlign: "left",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--fg)"
                  }}
                >
                  {faq.q}
                  <span style={{ color: "var(--fg-3)", transform: openFaq === index ? "rotate(45deg)" : "none", transition: "transform 0.15s" }}>+</span>
                </button>
                {openFaq === index && (
                  <p style={{ margin: "0 0 16px", color: "var(--fg-2)", fontSize: 14, lineHeight: 1.6 }}>{faq.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-cta-dark">
        <h2>
          <em>Open the app and know what to study next.</em>
        </h2>
        <p>No more second-guessing. LearnIt tells you exactly what needs your attention and why.</p>
        <Link href="/signup" className="btn btn-secondary" style={{ background: "var(--bg)", borderColor: "transparent", padding: "14px 32px", fontWeight: 600 }}>
          Create your free account
        </Link>
      </section>

      <section id="join" className="landing-section">
        <div className="landing-section-inner landing-grid-2" style={{ alignItems: "start" }}>
          <div>
            <p className="eyebrow">Beta waitlist</p>
            <h2>Not ready to sign up yet?</h2>
            <p style={{ color: "var(--fg-2)", lineHeight: 1.6 }}>
              Drop your email for early access updates. Your real workspace still lives at /app once you create an account.
            </p>
          </div>
          <form onSubmit={joinWaitlist} className="auth-form">
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="student@email.com" type="email" required />
            <Input value={examGoal} onChange={(event) => setExamGoal(event.target.value)} placeholder="Exam goal" />
            <Button type="submit" fullWidth>
              Save beta request
            </Button>
            {waitlistMessage && <p className="form-muted">{waitlistMessage}</p>}
          </form>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <Logo href="/" size="sm" />
          <div style={{ display: "flex", gap: 24, color: "var(--fg-3)", fontSize: 12 }}>
            <span>Privacy</span>
            <span>Terms</span>
            <span>Security</span>
            <Link href="/api/health" style={{ color: "var(--fg-3)" }}>
              Status
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
