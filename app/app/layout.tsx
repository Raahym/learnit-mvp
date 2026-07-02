"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/lib/useAuth";

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  onboarding_complete: boolean;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isReady, authorizedFetch, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isProfileReady, setIsProfileReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

    authorizedFetch("/api/profile")
      .then((response) => response.json())
      .then((data) => {
        if (cancelled) return;
        setProfile(data.profile ?? null);
        setIsProfileReady(true);

        const onboardingComplete = data.profile?.onboarding_complete ?? true;
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
      <div className="loadingScreen">
        <GraduationCap size={28} />
        <p>Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="appWrap">
      <nav className="topbar">
        <a className="brand" href="/">
          Learn<span>It</span>
        </a>
        <div className="accountMenu">
          <button type="button" className="iconButton" onClick={() => setMenuOpen((open) => !open)}>
            <UserCircle size={18} /> {profile?.full_name || user.email}
          </button>
          {menuOpen && (
            <div className="accountMenuDropdown">
              <span>{user.email}</span>
              <button type="button" onClick={handleLogout}>
                <LogOut size={14} /> Log out
              </button>
            </div>
          )}
        </div>
      </nav>
      {children}
    </div>
  );
}
