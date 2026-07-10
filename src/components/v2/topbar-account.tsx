"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Settings, LogOut } from "lucide-react";

export function TopbarAccount({ initial }: { initial: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function handleLogout() {
    document.cookie = "demo_mode=; path=/; max-age=0; SameSite=Lax";
    setOpen(false);
    router.push("/login");
  }

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        className="v2-icon-btn"
        aria-label="アカウント"
        title="アカウント"
        style={{ width: "auto", padding: "0 4px" }}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="v2-avatar">{initial}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            width: 200,
            background: "var(--v2-bg)",
            borderRadius: "var(--v2-radius-lg)",
            boxShadow: "var(--v2-shadow-lg)",
            border: "1px solid var(--v2-border)",
            zIndex: 70,
            overflow: "hidden",
            padding: 4,
          }}
        >
          <button
            onClick={() => { setOpen(false); router.push("/k4z8qm3x/settings"); }}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", fontSize: 13, color: "var(--v2-text)", borderRadius: "var(--v2-radius-sm)", textAlign: "left" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--v2-bg-alt)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Settings size={15} />
            店舗設定
          </button>
          <button
            onClick={handleLogout}
            style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", fontSize: 13, color: "var(--v2-danger)", borderRadius: "var(--v2-radius-sm)", textAlign: "left" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--v2-danger-bg)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <LogOut size={15} />
            ログアウト
          </button>
        </div>
      )}
    </div>
  );
}
