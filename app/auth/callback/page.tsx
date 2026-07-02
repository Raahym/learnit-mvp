"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function getHashParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.hash.replace(/^#/, ""));
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your email...");
  const hashParams = useMemo(getHashParams, []);

  useEffect(() => {
    const errorDescription = hashParams.get("error_description");
    if (errorDescription) {
      setMessage(errorDescription.replace(/\+/g, " "));
      return;
    }

    const supabase = getSupabaseBrowserClient();
    supabase?.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/app/onboarding");
        return;
      }

      setMessage("Email confirmed. Log in to open your LearnIt workspace.");
    });
  }, [hashParams, router]);

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
