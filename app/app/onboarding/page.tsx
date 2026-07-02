"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

type DraftSubject = {
  name: string;
  examDate: string;
  currentLevel: string;
  targetGrade: string;
  weeklyHours: string;
};

const levels = ["Just starting", "Getting there", "Fairly confident", "Nearly exam ready"];

function emptySubject(): DraftSubject {
  return { name: "", examDate: "", currentLevel: levels[0], targetGrade: "", weeklyHours: "" };
}

export default function OnboardingPage() {
  const router = useRouter();
  const { authorizedFetch } = useAuth();
  const [subjects, setSubjects] = useState<DraftSubject[]>([emptySubject()]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateSubject(index: number, patch: Partial<DraftSubject>) {
    setSubjects((current) => current.map((subject, i) => (i === index ? { ...subject, ...patch } : subject)));
  }

  function addSubject() {
    if (subjects.length >= 5) return;
    setSubjects((current) => [...current, emptySubject()]);
  }

  function removeSubject(index: number) {
    setSubjects((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const cleaned = subjects
      .map((subject) => ({ ...subject, name: subject.name.trim() }))
      .filter((subject) => subject.name.length > 0);

    if (cleaned.length === 0) {
      setError("Add at least one subject to continue.");
      return;
    }

    setIsSubmitting(true);

    const subjectsResponse = await authorizedFetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjects: cleaned.map((subject) => ({
          name: subject.name,
          examDate: subject.examDate || null,
          currentLevel: subject.currentLevel,
          targetGrade: subject.targetGrade,
          weeklyHours: subject.weeklyHours
        }))
      })
    });

    const subjectsData = await subjectsResponse.json();
    if (!subjectsResponse.ok || !subjectsData.ok) {
      setError(subjectsData.error ?? "Could not save your subjects.");
      setIsSubmitting(false);
      return;
    }

    const profileResponse = await authorizedFetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onboardingComplete: true })
    });

    if (!profileResponse.ok) {
      const profileData = await profileResponse.json().catch(() => null);
      setError(profileData?.error ?? "Could not finish onboarding.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/app");
  }

  return (
    <div className="onboardingWrap">
      <div className="onboardingIntro">
        <p className="eyebrow">
          <Sparkles size={14} /> Set up your workspace
        </p>
        <h1>What are you studying for?</h1>
        <p className="muted">
          Add each subject with its exam date, where you are right now, and your target grade. LearnIt uses this to
          personalize your dashboard and readiness score.
        </p>
      </div>

      <form className="onboardingForm" onSubmit={handleSubmit}>
        {subjects.map((subject, index) => (
          <div className="onboardingRow" key={index}>
            <div className="onboardingRowHead">
              <strong>Subject {index + 1}</strong>
              {subjects.length > 1 && (
                <button type="button" className="iconButton" onClick={() => removeSubject(index)}>
                  <Trash2 size={14} /> Remove
                </button>
              )}
            </div>
            <div className="onboardingGrid">
              <label>
                <span>Subject name</span>
                <input
                  value={subject.name}
                  onChange={(event) => updateSubject(index, { name: event.target.value })}
                  placeholder="e.g. Physics"
                  required={index === 0}
                />
              </label>
              <label>
                <span>Exam date</span>
                <input
                  value={subject.examDate}
                  onChange={(event) => updateSubject(index, { examDate: event.target.value })}
                  type="date"
                />
              </label>
              <label>
                <span>Current level</span>
                <select
                  value={subject.currentLevel}
                  onChange={(event) => updateSubject(index, { currentLevel: event.target.value })}
                >
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Target grade</span>
                <input
                  value={subject.targetGrade}
                  onChange={(event) => updateSubject(index, { targetGrade: event.target.value })}
                  placeholder="e.g. A*"
                />
              </label>
              <label>
                <span>Weekly hours available</span>
                <input
                  value={subject.weeklyHours}
                  onChange={(event) => updateSubject(index, { weeklyHours: event.target.value })}
                  type="number"
                  min={0}
                  placeholder="e.g. 6"
                />
              </label>
            </div>
          </div>
        ))}

        {subjects.length < 5 && (
          <button type="button" className="secondaryButton" onClick={addSubject}>
            <Plus size={16} /> Add another subject
          </button>
        )}

        {error && <p className="formError">{error}</p>}

        <button type="submit" className="primaryButton" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save and open dashboard"}
        </button>
      </form>
    </div>
  );
}
