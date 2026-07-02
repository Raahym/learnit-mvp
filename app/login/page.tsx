"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

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
    setMessage("Signing in...");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.replace("/app");
  }

  return (
    <main className="authPage">
      <div className="authCard">
        <a className="brand" href="/">
          Learn<span>It</span>
        </a>
        <div className="authIntro">
          <GraduationCap size={22} />
          <h1>Log in to your workspace</h1>
          <p>Pick up your readiness score, saved sessions, and quiz history where you left off.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="student@email.com"
            type="email"
            required
          />
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            type="password"
            minLength={6}
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Log in"}
          </button>
          {message && <p className={message.toLowerCase().includes("sign") ? "muted" : "formError"}>{message}</p>}
        </form>

        <p className="authSwitch">
          New to LearnIt? <a href="/signup">Create an account</a>
        </p>
      </div>
    </main>
  );
}
