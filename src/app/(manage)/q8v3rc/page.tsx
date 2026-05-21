"use client";

import { useState } from "react";
import { ShieldCheck, User, FileText, Eye, Edit, Trash2, Download } from "lucide-react";

interface AuditLog {
  id: string;
  createdAt: string;
  actor: string;
  action: string;
  targetTable: string;
  targetId: string;
  ip: string;
}

const INIT: AuditLog[] = [];

const ACTION_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  "customer.view":          { icon: <Eye className="w-3 h-3" />,      color: "#5a6977", label: "閲覧" },
  "customer.edit":          { icon: <Edit className="w-3 h-3" />,     color: "#3a8f7c", label: "編集" },
  "customer.delete":        { icon: <Trash2 className="w-3 h-3" />,   color: "#c0392b", label: "削除" },
  "customer.export":        { icon: <Download className="w-3 h-3" />, color: "#7c3aed", label: "エクスポート" },
  "tip.manual_adjust":      { icon: <Edit className="w-3 h-3" />,     color: "#c87b1a", label: "チップ手動調整" },
  "point_rule.update":      { icon: <Edit className="w-3 h-3" />,     color: "#3a8f7c", label: "ルール更新" },
};

export default function AuditLogPage() {
  const [filter, setFilter] = useState<"all" | "sensitive">("all");
  const sensitive = ["customer.delete", "customer.export", "tip.manual_adjust"];
  const rows = filter === "sensitive" ? INIT.filter((r) => sensitive.includes(r.action)) : INIT;

  return (
    <div className="page-stack">
      {/* 情報バナー (ガラス) */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-[var(--radius)]"
        style={{
          background: "rgba(32,156,110,0.08)",
          border: "1px solid rgba(32,156,110,0.18)",
          backdropFilter: "blur(8px)",
        }}
      >
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[color:var(--primary-text)]" />
        <p className="text-[13px] text-[color:var(--primary-text)] leading-relaxed">
          監査ログは<strong>オーナー権限のみ閲覧可能</strong>です。個人情報の閲覧・編集・削除・エクスポートは全て記録されます。
        </p>
      </div>

      {/* フィルタ */}
      <section>
        <div className="flex items-center gap-3">
          <div className="tabs">
            <button onClick={() => setFilter("all")} className={`tab ${filter === "all" ? "tab-active" : ""}`}>すべて</button>
            <button onClick={() => setFilter("sensitive")} className={`tab ${filter === "sensitive" ? "tab-active" : ""}`}>重要操作のみ</button>
          </div>
          <span className="ml-auto t-xs text-text-tertiary">{rows.length}件</span>
        </div>
      </section>

      {/* ログテーブル */}
      <section className="glass-panel">
        <p className="t-label mb-3">操作ログ</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>日時</th>
              <th>実行者</th>
              <th>操作</th>
              <th>対象</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = ACTION_META[r.action] ?? { icon: <FileText className="w-3 h-3" />, color: "#5a6977", label: r.action };
              return (
                <tr key={r.id}>
                  <td className="font-mono text-[12px] text-text-secondary whitespace-nowrap">{r.createdAt}</td>
                  <td>
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3 h-3 text-text-tertiary" />
                      <span className="text-text-primary">{r.actor}</span>
                    </span>
                  </td>
                  <td>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-medium" style={{ color: meta.color }}>
                      {meta.icon}{meta.label}
                    </span>
                  </td>
                  <td className="font-mono text-[12px] text-text-secondary">
                    {r.targetTable} / {r.targetId}
                  </td>
                  <td className="font-mono text-[12px] text-text-tertiary">{r.ip}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
