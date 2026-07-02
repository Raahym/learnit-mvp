"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function getAuthParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  const params = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  hashParams.forEach((value, key) => {
    if (!params.has(key)) {
      params.set(key, value);
    }
  });

  return params;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your email...");
  const authParams = useMemo(getAuthParams, []);

  useEffect(() => {
    const errorDescription = authParams.get("error_description");
    if (errorDescription) {
      setMessage(errorDescription.replace(/\+/g, " "));
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setMessage("Supabase auth is not configured for this deployment.");
      return;
    }

    const code = authParams.get("code");
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          setMessage(error.message);
          return;
        }

        if (data.session) {
          router.replace("/app/onboarding");
          return;
        }

        setMessage("Email confirmed. Log in to open your LearnIt workspace.");
      });
      return;
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        setMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace("/app/onboarding");
        return;
      }

      setMessage("Email confirmed. Log in to open your LearnIt workspace.");
    });
  }, [authParams, router]);

  return (
    <main className="authPage">
      <div className="authCard">
        <a className="brand" href="/">
          Learn<span>It</span>
        </a>
        <div className="authIntro">
          <GraduationCap size={22} />
          <h1>Email confirmation</h1>
          <p>{message}</p>
        </div>
        <a className="primaryButton" href="/signup">Create a fresh link</a>
        <a className="secondaryButton" href="/login">Go to login</a>
      </div>
    </main>
  );
}
