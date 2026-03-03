"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredProjects, type Project } from "@/lib/projects";
import { Layers, Clock, Settings, Tag } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function Sidebar() {
  const pathname = usePathname();
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProjects(getStoredProjects());
  }, []);

  const recentProjects = mounted ? projects.slice(-5).reverse() : [];

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid var(--border)",
        background: "var(--sidebar)",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {/* Wordmark */}
      <div
        style={{
          padding: "16px 16px 14px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-playfair), serif",
            fontStyle: "italic",
            fontSize: 22,
            fontWeight: 500,
            color: "var(--foreground)",
            letterSpacing: "-0.01em",
          }}
        >
          Patina
        </span>
      </div>

      {/* Nav */}
      <nav style={{ padding: "0 8px", display: "flex", flexDirection: "column", gap: 1 }}>
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 8px",
            borderRadius: "var(--radius)",
            background: pathname === "/" ? "var(--sidebar-accent)" : "transparent",
            color: pathname === "/" ? "var(--foreground)" : "var(--muted-foreground)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <Layers size={14} strokeWidth={1.5} />
          All projects
        </Link>
        <Link
          href="/pricing"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 8px",
            borderRadius: "var(--radius)",
            background: pathname === "/pricing" ? "var(--sidebar-accent)" : "transparent",
            color: pathname === "/pricing" ? "var(--foreground)" : "var(--muted-foreground)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          <Tag size={14} strokeWidth={1.5} />
          Pricing
        </Link>
      </nav>

      {/* Recent projects */}
      {recentProjects.length > 0 && (
        <div style={{ padding: "20px 8px 8px", flex: 1, overflow: "hidden" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 10,
              fontWeight: 600,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              padding: "0 8px",
              marginBottom: 6,
            }}
          >
            <Clock size={10} strokeWidth={1.5} />
            Recent
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {recentProjects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.id}`}
                style={{
                  display: "block",
                  padding: "5px 8px",
                  borderRadius: "var(--radius)",
                  color: "var(--muted-foreground)",
                  fontSize: 12,
                  textDecoration: "none",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  transition: "color 0.1s, background 0.1s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "var(--foreground)";
                  e.currentTarget.style.background = "var(--sidebar-accent)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--muted-foreground)";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {p.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Settings link */}
      <div style={{ padding: "8px 8px 12px", marginTop: "auto" }}>
        <Link
          href="/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 8px",
            borderRadius: "var(--radius)",
            color: pathname === "/settings" ? "var(--foreground)" : "var(--muted-foreground)",
            background: pathname === "/settings" ? "var(--sidebar-accent)" : "transparent",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
            transition: "color 0.1s, background 0.1s",
          }}
          onMouseEnter={(e) => {
            if (pathname !== "/settings") {
              e.currentTarget.style.color = "var(--foreground)";
              e.currentTarget.style.background = "var(--sidebar-accent)";
            }
          }}
          onMouseLeave={(e) => {
            if (pathname !== "/settings") {
              e.currentTarget.style.color = "var(--muted-foreground)";
              e.currentTarget.style.background = "transparent";
            }
          }}
        >
          <Settings size={14} strokeWidth={1.5} />
          Settings
        </Link>
      </div>
    </aside>
  );
}

function UserHeader({ user }: { user: User }) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/auth");
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
      }}
    >
      <Avatar style={{ width: 28, height: 28 }}>
        <AvatarFallback>
          {user.email?.[0]}
        </AvatarFallback>
      </Avatar>
      <button
        onClick={handleSignOut}
        style={{
          fontSize: 12,
          color: "var(--muted-foreground)",
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "3px 10px",
          cursor: "pointer",
          transition: "color 0.1s, border-color 0.1s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--foreground)";
          e.currentTarget.style.borderColor = "var(--foreground)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--muted-foreground)";
          e.currentTarget.style.borderColor = "var(--border)";
        }}
      >
        Sign out
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomepage = pathname === "/" || pathname === "/settings" || pathname === "/pricing";
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowser();

    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      setUser(data.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!isHomepage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      {user && <UserHeader user={user} />}
      <Sidebar />
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
