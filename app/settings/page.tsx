"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getUserContext, setUserContext } from "@/lib/projects";

export default function SettingsPage() {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(getUserContext());
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(text: string) {
    setValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setUserContext(text);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    }, 400);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        fontFamily: "'DM Sans',-apple-system,sans-serif",
        padding: "40px 24px",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#333;border-radius:3px}
        textarea:focus{outline:none}
        @keyframes fadeOut{0%{opacity:1}70%{opacity:1}100%{opacity:0}}
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#555",
              textDecoration: "none",
              marginBottom: 24,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#555")}
          >
            ← Projects
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em" }}>Settings</h1>
            {saved && (
              <span
                style={{
                  fontSize: 11,
                  color: "#666",
                  animation: "fadeOut 1.8s ease forwards",
                }}
              >
                Saved
              </span>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 4 }}>
              Aesthetic preferences
            </div>
            <div style={{ fontSize: 11, color: "#555", marginBottom: 10, lineHeight: 1.6 }}>
              Describe your design sensibility — style preferences, things to avoid, or any aesthetic direction you want AI to follow across all projects.
            </div>
          </div>
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={`e.g. "Prefer dark interfaces with high contrast. Avoid gradients. Typography should be clean and minimal — DM Sans or similar. No unnecessary decoration."`}
            rows={8}
            style={{
              width: "100%",
              background: "#0f0f0f",
              border: "1px solid #2a2a2a",
              borderRadius: 8,
              padding: "12px 14px",
              color: "#e0e0e0",
              fontSize: 12,
              fontFamily: "inherit",
              resize: "vertical",
              lineHeight: 1.6,
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#3a3a3a")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#2a2a2a")}
          />
          <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>
            Auto-saved · Applied to all AI generations across all projects
          </div>
        </div>
      </div>
    </div>
  );
}
