"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

export default function SignupPage() {
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
    setMessage("Creating account...");

    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      router.replace("/app/onboarding");
      return;
    }

    setIsSubmitting(false);
    setMessage("Account created. Check your email to confirm it, then log in.");
  }

  return (
    <main className="authPage">
      <div className="authCard">
        <a className="brand" href="/">
          Learn<span>It</span>
        </a>
        <div className="authIntro">
          <GraduationCap size={22} />
          <h1>Create a real LearnIt account</h1>
          <p>Set up subjects, track sessions, and get a personalized readiness score in your own workspace.</p>
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
            placeholder="Password (min 6 characters)"
            type="password"
            minLength={6}
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
          {message && <p className={message.toLowerCase().includes("creat") ? "muted" : "formError"}>{message}</p>}
        </form>

        <p className="authSwitch">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </main>
  );
}
