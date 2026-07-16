"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  FileText,
  Home,
  Layers,
  Menu,
  Settings,
  X
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

type Subject = {
  id: string;
  name: string;
  exam_date: string | null;
  readiness: number;
};

type AppShellProps = {
  children: React.ReactNode;
  profileName?: string | null;
  profileEmail?: string | null;
  subjects?: Subject[];
  onLogout: () => void;
};

const mainNav = [
  { href: "/app", label: "Today", icon: Home },
  { href: "/app/subjects", label: "Subjects", icon: BookOpen },
  { href: "/app/plan", label: "Plan", icon: Calendar },
  { href: "/app/flashcards", label: "Flashcards", icon: Layers },
  { href: "/app/quizzes", label: "Quizzes", icon: FileText },
  { href: "/app/progress", label: "Progress", icon: BarChart3 },
  { href: "/app/library", label: "Library", icon: BookOpen },
  { href: "/app/mistakes", label: "Mistakes", icon: AlertCircle }
];

const subjectColors = ["#1B3CA8", "#276649", "#6B3FB5", "#BC4F15", "#9A5D08"];

function daysUntil(dateString: string | null) {
  if (!dateString) return null;
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function initials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  return (email?.[0] ?? "U").toUpperCase();
}

export function AppShell({ children, profileName, profileEmail, subjects = [], onLogout }: AppShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const urgentSubject = useMemo(() => {
    if (!subjects.length) return null;
    return [...subjects].sort((a, b) => {
      const daysA = daysUntil(a.exam_date) ?? 999;
      const daysB = daysUntil(b.exam_date) ?? 999;
      return daysA - daysB;
    })[0];
  }, [subjects]);

  const urgentDays = urgentSubject ? daysUntil(urgentSubject.exam_date) : null;

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (pathname === "/app/onboarding") {
    return <div className="app-main-full">{children}</div>;
  }

  return (
    <div className="app-shell">
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        onClick={() => setSidebarOpen((open) => !open)}
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {sidebarOpen && (
        <button
          type="button"
          className="mobile-nav-overlay"
          aria-label="Close menu overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="app-sidebar-logo">
          <Logo href="/app" variant="light" />
        </div>

        {urgentSubject && urgentDays !== null && urgentDays >= 0 && (
          <div className="app-sidebar-urgency">
            <p>
              Exam · {urgentDays} day{urgentDays === 1 ? "" : "s"}
            </p>
            <p>{urgentSubject.name}</p>
          </div>
        )}

        <nav className="app-nav">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                className={`app-nav-item ${isActive ? "active" : ""}`}
                href={item.href}
                style={{ textDecoration: "none" }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {subjects.length > 0 && (
            <div className="app-nav-section">
              <p className="app-nav-section-title">Subjects</p>
              {subjects.map((subject, index) => {
                const days = daysUntil(subject.exam_date);
                return (
                  <Link
                    key={subject.id}
                    className="app-nav-item"
                    href="/app/subjects"
                    style={{ paddingTop: 6, paddingBottom: 6, textDecoration: "none" }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: subjectColors[index % subjectColors.length],
                        flexShrink: 0
                      }}
                    />
                    <span style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {subject.name.split(" ").slice(0, 2).join(" ")}
                    </span>
                    {days !== null && days <= 10 && days >= 0 && (
                      <span className="font-mono" style={{ marginLeft: "auto", fontSize: 10, color: "var(--accent)" }}>
                        {days}d
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="app-sidebar-user">
          <div className="app-sidebar-avatar">{initials(profileName, profileEmail)}</div>
          <div className="app-sidebar-user-info">
            <p>{profileName || profileEmail || "Student"}</p>
            <p>{profileEmail ?? "LearnIt workspace"}</p>
          </div>
          <Link
            className="app-nav-item"
            style={{ width: "auto", padding: 6, textDecoration: "none" }}
            aria-label="Settings"
            href="/app/settings"
          >
            <Settings size={15} />
          </Link>
        </div>
        <button
          type="button"
          className="app-nav-item"
          style={{ margin: "0 12px 12px", color: "var(--sidebar-muted)" }}
          onClick={onLogout}
        >
          Log out
        </button>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}
