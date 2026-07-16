"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/useAuth";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  onboarding_complete: boolean;
};

type Subject = {
  id: string;
  name: string;
  exam_date: string | null;
  readiness: number;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady, authorizedFetch, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isProfileReady, setIsProfileReady] = useState(false);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  useEffect(() => {
    if (!isReady || !user) {
      return;
    }

    let cancelled = false;
    setIsProfileReady(false);

    Promise.all([authorizedFetch("/api/profile"), authorizedFetch("/api/subjects")])
      .then(async ([profileResponse, subjectsResponse]) => {
        const profileData = await profileResponse.json();
        const subjectsData = subjectsResponse.ok ? await subjectsResponse.json() : { subjects: [] };

        if (cancelled) return;

        setProfile(profileData.profile ?? null);
        setSubjects(subjectsData.subjects ?? []);
        setIsProfileReady(true);

        const onboardingComplete = profileData.profile?.onboarding_complete ?? false;
        if (!onboardingComplete && pathname !== "/app/onboarding") {
          router.replace("/app/onboarding");
        }
      })
      .catch(() => {
        if (!cancelled) setIsProfileReady(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, user]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (!isReady || !user || (!isProfileReady && pathname !== "/app/onboarding")) {
    return (
      <div className="loading-screen">
        <GraduationCap size={28} color="var(--primary)" />
        <p>Loading your workspace...</p>
      </div>
    );
  }

  return (
    <AppShell
      profileName={profile?.full_name}
      profileEmail={profile?.email ?? user.email}
      subjects={subjects}
      onLogout={handleLogout}
    >
      {children}
    </AppShell>
  );
}
