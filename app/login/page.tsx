"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/lib/useAuth";

function AuthVisual() {
  return (
    <div className="auth-visual">
      <blockquote>&ldquo;The gap between your confidence and your actual score — that&apos;s what we fix.&rdquo;</blockquote>
      <div className="auth-metric-stack">
        {[
          { label: "Confidence", value: "74%", note: "You feel ready" },
          { label: "Mastery", value: "61%", note: "Quiz performance tells a different story" },
          { label: "Gap", value: "−13%", note: "LearnIt targets this difference", accent: true }
        ].map((metric) => (
          <div key={metric.label} className={`auth-metric ${metric.accent ? "accent" : ""}`}>
            <div>
              <p className="font-mono eyebrow" style={{ margin: 0, color: metric.accent ? "var(--accent)" : "var(--sidebar-muted)" }}>
                {metric.label}
              </p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{metric.note}</p>
            </div>
            <span className="font-mono" style={{ fontSize: 20, fontWeight: 500, color: metric.accent ? "var(--accent)" : "var(--surface)" }}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, isReady, isConfigured, supabase } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      router.replace("/app");
    }
  }, [isReady, user, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !isConfigured) {
      setMessage("Supabase public env vars are missing. Add them to enable real auth.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/app");
  }

  return (
    <main className="auth-page">
      <div className="auth-form-side">
        <div className="auth-form-wrap">
          <div style={{ marginBottom: 40 }}>
            <Logo href="/" />
          </div>

          <h1>Welcome back</h1>
          <p>Sign in to continue where you left off.</p>

          <button type="button" className="btn btn-secondary btn-full" disabled title="Google OAuth not configured yet" style={{ marginBottom: 16, opacity: 0.55 }}>
            Continue with Google
          </button>

          <div className="auth-divider">
            <hr />
            <span>or</span>
            <hr />
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@email.com"
              type="email"
              required
            />
            <Input
              label="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              type="password"
              minLength={6}
              required
            />

            {message && <div className="form-error">{message}</div>}

            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="auth-switch">
            Don&apos;t have an account? <Link href="/signup">Create one — it&apos;s free</Link>
          </p>
        </div>
      </div>
      <AuthVisual />
    </main>
  );
}
