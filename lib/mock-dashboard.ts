/**
 * TODO: Replace with Supabase-backed planner/assignments when backend routes exist.
 * Isolated mock data for dashboard UI fallbacks only.
 */

export type TodayPlanItem = {
  id: string;
  type: "review" | "flashcards" | "assignment" | "quiz";
  title: string;
  time: string;
  duration: number;
  subject: string;
  priority?: "critical" | "normal";
};

export type WeeklyDay = {
  day: string;
  minutes: number;
  target: number;
};

export type AssignmentItem = {
  id: string;
  title: string;
  subject: string;
  daysUntilDue: number;
  status: "pending" | "in-progress";
  progress?: number;
};

export const todayPlanFallback: TodayPlanItem[] = [
  {
    id: "plan-1",
    type: "review",
    title: "Review weak topic from recent quizzes",
    time: "09:00",
    duration: 25,
    subject: "Primary subject",
    priority: "critical"
  },
  {
    id: "plan-2",
    type: "flashcards",
    title: "Flashcard review session",
    time: "10:00",
    duration: 20,
    subject: "Primary subject"
  },
  {
    id: "plan-3",
    type: "quiz",
    title: "Adaptive quiz on priority topics",
    time: "11:00",
    duration: 30,
    subject: "Primary subject"
  }
];

export const weeklyDataFallback: WeeklyDay[] = [
  { day: "Mon", minutes: 90, target: 120 },
  { day: "Tue", minutes: 120, target: 120 },
  { day: "Wed", minutes: 75, target: 120 },
  { day: "Thu", minutes: 60, target: 120 },
  { day: "Fri", minutes: 0, target: 120 },
  { day: "Sat", minutes: 45, target: 90 },
  { day: "Sun", minutes: 30, target: 90 }
];

export const assignmentsFallback: AssignmentItem[] = [
  {
    id: "a1",
    title: "Problem set / coursework",
    subject: "Primary subject",
    daysUntilDue: 5,
    status: "in-progress",
    progress: 40
  },
  {
    id: "a2",
    title: "Lab report draft",
    subject: "Secondary subject",
    daysUntilDue: 12,
    status: "pending"
  }
];
