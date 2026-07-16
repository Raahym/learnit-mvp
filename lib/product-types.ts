export type WorkspaceState =
  | "onboarding_required"
  | "no_subjects"
  | "subjects_no_exam"
  | "subjects_no_topics"
  | "subjects_no_materials"
  | "materials_processing"
  | "needs_diagnostic"
  | "active_basic"
  | "exam_week"
  | "mature_user";

export type SubjectRecord = {
  id: string;
  name: string;
  exam_date: string | null;
  current_level: string | null;
  target_grade: string | null;
  weekly_hours: number | null;
  readiness: number;
  weak_topic: string | null;
  created_at?: string;
};

export type TopicRecord = {
  id: string;
  subject_id: string | null;
  name: string;
  confidence: number | null;
  mastery: number | null;
  retention: number | null;
  coverage_status: "not_started" | "learning" | "reviewing" | "exam_ready";
  last_reviewed_at: string | null;
};

export type MaterialRecord = {
  id: string;
  title: string;
  material_type: string;
  subject: string | null;
  subject_id?: string | null;
  status: string;
  concept_count: number;
  storage_path?: string | null;
  created_at: string;
};

export type StudySessionRecord = {
  id: string;
  subject: string;
  topic: string;
  confidence: number;
  minutes: number;
  readiness_gain: number;
  created_at: string;
};

export type QuizAttemptRecord = {
  id: string;
  subject: string;
  topic: string;
  question: string;
  selected_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  confidence: number | null;
  created_at: string;
};

export type StudyTaskRecord = {
  id: string;
  title: string;
  reason: string | null;
  task_type: "setup" | "review" | "quiz" | "flashcards" | "upload" | "assignment";
  estimated_minutes: number | null;
  priority: "low" | "normal" | "high" | "critical";
  scheduled_for: string | null;
  due_at: string | null;
  completed_at: string | null;
  subject_id: string | null;
  topic_id: string | null;
};

export type SetupChecklistItem = {
  id: string;
  label: string;
  detail: string;
  href: string;
  done: boolean;
};

export type DashboardPrimaryAction = {
  label: string;
  title: string;
  reason: string;
  href: string;
  cta: string;
  evidence: string;
};

export type DashboardModel = {
  ok: true;
  mode: "supabase" | "demo";
  workspaceState: WorkspaceState;
  stateLabel: string;
  profile: {
    id: string;
    email: string | null;
    full_name: string | null;
    onboarding_complete: boolean;
  } | null;
  primaryAction: DashboardPrimaryAction;
  subjects: SubjectRecord[];
  topics: TopicRecord[];
  tasks: StudyTaskRecord[];
  materials: MaterialRecord[];
  sessions: StudySessionRecord[];
  quizAttempts: QuizAttemptRecord[];
  weakTopics: Array<{
    name: string;
    subject: string;
    readiness: number;
    evidence: string;
  }>;
  readinessSummary: {
    status: "unavailable" | "low_confidence" | "estimated" | "evidence_based";
    score: number | null;
    explanation: string;
  };
  quizSummary: {
    total: number;
    correct: number;
    accuracy: number | null;
  };
  activitySummary: {
    sessionCount: number;
    materialCount: number;
    quizAttemptCount: number;
  };
  setupChecklist: SetupChecklistItem[];
};
