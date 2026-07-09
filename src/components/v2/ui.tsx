"use client";

import { useEffect, type ReactNode, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import { X } from "lucide-react";

// ============= Button =============
type BtnVariant = "default" | "primary" | "ghost" | "danger";
type BtnSize = "default" | "sm" | "xs";
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
}
export function Btn({ variant = "default", size = "default", className = "", children, ...rest }: BtnProps) {
  const v = variant === "primary" ? "v2-btn-primary" : variant === "ghost" ? "v2-btn-ghost" : variant === "danger" ? "v2-btn-danger" : "";
  const s = size === "sm" ? "v2-btn-sm" : size === "xs" ? "v2-btn-xs" : "";
  return <button className={`v2-btn ${v} ${s} ${className}`} {...rest}>{children}</button>;
}

// ============= Panel =============
export function Panel({ title, action, children, className = "" }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`v2-panel ${className}`}>
      {(title || action) && (
        <div className="v2-panel-head">
          {title && <div className="v2-h2">{title}</div>}
          {action && <div style={{ marginLeft: "auto" }}>{action}</div>}
        </div>
      )}
      <div className="v2-panel-body">{children}</div>
    </div>
  );
}

// ============= KPI =============
export function Kpis({ children }: { children: ReactNode }) {
  return <div className="v2-kpis">{children}</div>;
}
export function Kpi({ label, value, sub }: { label: ReactNode; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="v2-kpi">
      <div className="v2-kpi__label">{label}</div>
      <div className="v2-kpi__value">{value}</div>
      {sub && <div className="v2-kpi__sub">{sub}</div>}
    </div>
  );
}

// ============= Chip =============
export function Chip({ variant, children }: { variant?: "success" | "danger" | "warn"; children: ReactNode }) {
  const v = variant === "success" ? "v2-chip-success" : variant === "danger" ? "v2-chip-danger" : variant === "warn" ? "v2-chip-warn" : "";
  return <span className={`v2-chip ${v}`}>{children}</span>;
}
export function Dot({ variant }: { variant?: "success" | "danger" | "warn" }) {
  const v = variant === "success" ? "v2-dot-success" : variant === "danger" ? "v2-dot-danger" : variant === "warn" ? "v2-dot-warn" : "";
  return <span className={`v2-dot ${v}`} />;
}

// ============= Field =============
export function Field({ label, required, children, hint }: { label: ReactNode; required?: boolean; children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="v2-field">
      <label className={required ? "v2-field-required" : undefined}>{label}</label>
      {children}
      {hint && <div style={{ fontSize: 11, color: "var(--v2-text-mute)", lineHeight: 1.5 }}>{hint}</div>}
    </div>
  );
}

// ============= Modal =============
export function Modal({ open, onClose, title, children, footer, size = "default" }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; footer?: ReactNode;
  size?: "default" | "lg";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="v2-overlay" onClick={onClose}>
      <div className="v2-modal" style={{ maxWidth: size === "lg" ? 720 : 520 }} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="v2-panel-head">
            <div className="v2-h2">{title}</div>
            <button onClick={onClose} className="v2-btn-ghost" style={{ marginLeft: "auto", height: 24, width: 24, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }} aria-label="閉じる">
              <X size={14} />
            </button>
          </div>
        )}
        <div className="v2-panel-body">{children}</div>
        {footer && <div className="v2-panel-head" style={{ borderTop: "1px solid var(--v2-border)", borderBottom: 0, justifyContent: "flex-end", gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}

// ============= Drawer =============
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="v2-overlay" style={{ padding: 0 }} onClick={onClose} />
      <aside className="v2-drawer" onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="v2-panel-head" style={{ position: "sticky", top: 0, background: "var(--v2-bg)" }}>
            <div className="v2-h2">{title}</div>
            <button onClick={onClose} className="v2-btn-ghost" style={{ marginLeft: "auto", height: 24, width: 24, padding: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }} aria-label="閉じる">
              <X size={14} />
            </button>
          </div>
        )}
        <div style={{ padding: 16 }}>{children}</div>
      </aside>
    </>
  );
}

// ============= Tabs =============
export function Tabs({ value, onChange, items }: { value: string; onChange: (v: string) => void; items: { value: string; label: ReactNode }[] }) {
  return (
    <div className="v2-tabs">
      {items.map((it) => (
        <button
          key={it.value}
          className={`v2-tab ${value === it.value ? "is-active" : ""}`}
          onClick={() => onChange(it.value)}
        >{it.label}</button>
      ))}
    </div>
  );
}

// ============= Empty =============
export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="v2-table-empty" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
      {children}
    </div>
  );
}

// ============= PageHeader =============
export function PageHeader({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="v2-spread" style={{ marginBottom: 20 }}>
      <div>
        <h1 className="v2-h1">{title}</h1>
        {sub && <div className="v2-mute" style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}
      </div>
      {action && <div style={{ display: "flex", gap: 8 }}>{action}</div>}
    </div>
  );
}

// ============= Stack helper (vertical gap) =============
export function VStack({ gap = 16, children, ...rest }: { gap?: number; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} style={{ display: "flex", flexDirection: "column", gap, ...(rest.style ?? {}) }}>{children}</div>;
}
export function HStack({ gap = 8, children, ...rest }: { gap?: number; children: ReactNode } & HTMLAttributes<HTMLDivElement>) {
  return <div {...rest} style={{ display: "flex", alignItems: "center", gap, ...(rest.style ?? {}) }}>{children}</div>;
}
