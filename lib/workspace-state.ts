import type {
  DashboardModel,
  DashboardPrimaryAction,
  MaterialRecord,
  QuizAttemptRecord,
  SetupChecklistItem,
  StudySessionRecord,
  StudyTaskRecord,
  SubjectRecord,
  TopicRecord,
  WorkspaceState
} from "./product-types";

type ProfileInput = DashboardModel["profile"];

function daysUntil(dateString: string | null) {
  if (!dateString) return null;
  const diff = Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Number.isFinite(diff) ? diff : null;
}

function stateLabel(state: WorkspaceState) {
  const labels: Record<WorkspaceState, string> = {
    onboarding_required: "Onboarding needed",
    no_subjects: "No subjects yet",
    subjects_no_exam: "Exam dates missing",
    subjects_no_topics: "Topics missing",
    subjects_no_materials: "Materials missing",
    materials_processing: "Materials processing",
    needs_diagnostic: "Needs diagnostic",
    active_basic: "Active workspace",
    exam_week: "Exam week",
    mature_user: "Evidence-based workspace"
  };
  return labels[state];
}

export function getWorkspaceState(input: {
  profile: ProfileInput;
  subjects: SubjectRecord[];
  topics: TopicRecord[];
  materials: MaterialRecord[];
  sessions: StudySessionRecord[];
  quizAttempts: QuizAttemptRecord[];
  tasks: StudyTaskRecord[];
}): WorkspaceState {
  const { profile, subjects, topics, materials, sessions, quizAttempts, tasks } = input;
  if (!profile || !profile.onboarding_complete) return "onboarding_required";
  if (subjects.length === 0) return "no_subjects";
  if (subjects.every((subject) => !subject.exam_date)) return "subjects_no_exam";
  if (topics.length === 0 && subjects.every((subject) => !subject.weak_topic)) return "subjects_no_topics";
  if (materials.length === 0) return "subjects_no_materials";
  if (materials.some((material) => ["uploaded", "processing", "indexed"].includes(material.status))) {
    return "materials_processing";
  }
  if (quizAttempts.length === 0) return "needs_diagnostic";
  const nearestExam = Math.min(...subjects.map((subject) => daysUntil(subject.exam_date) ?? 999));
  if (nearestExam <= 7) return "exam_week";
  if (quizAttempts.length >= 8 && sessions.length >= 4 && tasks.some((task) => task.completed_at)) return "mature_user";
  return "active_basic";
}

export function buildSetupChecklist(input: {
  state: WorkspaceState;
  subjects: SubjectRecord[];
  topics: TopicRecord[];
  materials: MaterialRecord[];
  quizAttempts: QuizAttemptRecord[];
}): SetupChecklistItem[] {
  const { subjects, topics, materials, quizAttempts } = input;
  return [
    {
      id: "subjects",
      label: "Add at least one subject",
      detail: "LearnIt needs subjects before it can prioritize anything.",
      href: "/app/onboarding",
      done: subjects.length > 0
    },
    {
      id: "exam-date",
      label: "Add an exam date",
      detail: "Exam dates turn a generic workspace into an urgent study plan.",
      href: "/app/subjects",
      done: subjects.some((subject) => Boolean(subject.exam_date))
    },
    {
      id: "topics",
      label: "Add topics or weak areas",
      detail: "Topics are the unit LearnIt should diagnose, quiz, and improve.",
      href: "/app/subjects",
      done: topics.length > 0 || subjects.some((subject) => Boolean(subject.weak_topic))
    },
    {
      id: "materials",
      label: "Upload study material",
      detail: "Notes, PDFs, or past papers give AI generation a real source.",
      href: "/app/library",
      done: materials.length > 0
    },
    {
      id: "diagnostic",
      label: "Complete a diagnostic quiz",
      detail: "Quiz evidence is required before readiness becomes trustworthy.",
      href: "/app/quizzes",
      done: quizAttempts.length > 0
    }
  ];
}

export function buildPrimaryAction(input: {
  state: WorkspaceState;
  subjects: SubjectRecord[];
  topics: TopicRecord[];
  materials: MaterialRecord[];
  tasks: StudyTaskRecord[];
  quizAttempts: QuizAttemptRecord[];
  weakTopics: Array<{ name: string; subject: string; readiness: number; evidence: string }>;
}): DashboardPrimaryAction {
  const { state, subjects, topics, materials, tasks, quizAttempts, weakTopics } = input;
  const openTask = tasks.find((task) => !task.completed_at);
  const subject = [...subjects].sort((a, b) => (daysUntil(a.exam_date) ?? 999) - (daysUntil(b.exam_date) ?? 999))[0];
  const weakTopic = weakTopics[0];

  if (state === "onboarding_required" || state === "no_subjects") {
    return {
      label: "Setup required",
      title: "Add your first subject",
      reason: "LearnIt cannot recommend a study action until it knows what you are studying.",
      href: "/app/onboarding",
      cta: "Start setup",
      evidence: "No subject data found."
    };
  }

  if (state === "subjects_no_exam") {
    return {
      label: "Missing priority signal",
      title: "Add exam dates",
      reason: "Without an exam date, LearnIt cannot judge urgency or build a realistic plan.",
      href: "/app/subjects",
      cta: "Add exam date",
      evidence: `${subjects.length} subject${subjects.length === 1 ? "" : "s"} saved, no exam date found.`
    };
  }

  if (state === "subjects_no_topics") {
    return {
      label: "Missing topic map",
      title: `Break ${subject?.name ?? "your subject"} into topics`,
      reason: "A subject is too broad. LearnIt needs topics before it can detect weak areas.",
      href: "/app/subjects",
      cta: "Add topics",
      evidence: `${subjects.length} subject${subjects.length === 1 ? "" : "s"} saved, no topic evidence yet.`
    };
  }

  if (state === "subjects_no_materials") {
    return {
      label: "Missing source material",
      title: "Upload notes or a past paper",
      reason: "Materials let LearnIt generate quizzes and flashcards from your real course content.",
      href: "/app/library",
      cta: "Upload material",
      evidence: `${subjects.length} subject${subjects.length === 1 ? "" : "s"} saved, 0 materials uploaded.`
    };
  }

  if (state === "materials_processing") {
    return {
      label: "Material status",
      title: "Check uploaded materials",
      reason: "Some files are uploaded but not ready for source-based generation yet.",
      href: "/app/library",
      cta: "Open library",
      evidence: `${materials.length} material${materials.length === 1 ? "" : "s"} found.`
    };
  }

  if (state === "needs_diagnostic") {
    return {
      label: "Evidence needed",
      title: `Take a diagnostic quiz${subject?.name ? ` for ${subject.name}` : ""}`,
      reason: "Readiness and weak-topic detection need quiz evidence, not just setup data.",
      href: "/app/quizzes",
      cta: "Start diagnostic",
      evidence: "0 quiz attempts saved."
    };
  }

  if (openTask) {
    return {
      label: "Next task",
      title: openTask.title,
      reason: openTask.reason ?? "This is the next incomplete task in your study plan.",
      href: "/app/plan",
      cta: "Open plan",
      evidence: openTask.estimated_minutes ? `${openTask.estimated_minutes} minute task` : "Saved task"
    };
  }

  if (weakTopic) {
    return {
      label: state === "exam_week" ? "Exam-week priority" : "Weak topic",
      title: `Review ${weakTopic.name}`,
      reason: `${weakTopic.name} is currently the clearest weak area in ${weakTopic.subject}.`,
      href: "/app/quizzes",
      cta: "Practice it",
      evidence: weakTopic.evidence
    };
  }

  return {
    label: "Keep momentum",
    title: "Create the next study task",
    reason: "You have enough activity to plan the next block, but no open task is saved yet.",
    href: "/app/plan",
    cta: "Create task",
    evidence: `${quizAttempts.length} quiz attempt${quizAttempts.length === 1 ? "" : "s"} saved.`
  };
}

export function buildDashboardModel(input: {
  mode: "supabase" | "demo";
  profile: ProfileInput;
  subjects: SubjectRecord[];
  topics: TopicRecord[];
  materials: MaterialRecord[];
  sessions: StudySessionRecord[];
  quizAttempts: QuizAttemptRecord[];
  tasks: StudyTaskRecord[];
}): DashboardModel {
  const state = getWorkspaceState(input);
  const weakTopics = input.subjects
    .filter((subject) => subject.weak_topic)
    .sort((a, b) => a.readiness - b.readiness)
    .map((subject) => ({
      name: subject.weak_topic as string,
      subject: subject.name,
      readiness: subject.readiness,
      evidence: "Saved weak-topic field. Needs quiz evidence to become reliable."
    }));
  const setupChecklist = buildSetupChecklist({ ...input, state });
  const correct = input.quizAttempts.filter((attempt) => attempt.is_correct).length;
  const readinessScores = input.subjects.map((subject) => Number(subject.readiness)).filter(Number.isFinite);
  const readinessScore = readinessScores.length
    ? Math.round(readinessScores.reduce((sum, value) => sum + value, 0) / readinessScores.length)
    : null;
  const evidenceCount = input.quizAttempts.length + input.sessions.length;
  const readinessStatus =
    readinessScore === null
      ? "unavailable"
      : evidenceCount === 0
        ? "low_confidence"
        : evidenceCount < 5
          ? "estimated"
          : "evidence_based";

  return {
    ok: true,
    mode: input.mode,
    workspaceState: state,
    stateLabel: stateLabel(state),
    profile: input.profile,
    primaryAction: buildPrimaryAction({ ...input, state, weakTopics }),
    subjects: input.subjects,
    topics: input.topics,
    tasks: input.tasks,
    materials: input.materials,
    sessions: input.sessions,
    quizAttempts: input.quizAttempts,
    weakTopics,
    readinessSummary: {
      status: readinessStatus,
      score: readinessScore,
      explanation:
        readinessStatus === "unavailable"
          ? "No subject exists yet, so readiness is unavailable."
          : readinessStatus === "low_confidence"
            ? "This is onboarding-level readiness. Complete quizzes before trusting it."
            : readinessStatus === "estimated"
              ? "This is an early estimate based on limited study and quiz evidence."
              : "This score is based on saved study and quiz evidence."
    },
    quizSummary: {
      total: input.quizAttempts.length,
      correct,
      accuracy: input.quizAttempts.length ? Math.round((correct / input.quizAttempts.length) * 100) : null
    },
    activitySummary: {
      sessionCount: input.sessions.length,
      materialCount: input.materials.length,
      quizAttemptCount: input.quizAttempts.length
    },
    setupChecklist
  };
}
