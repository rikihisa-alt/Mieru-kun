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

const INIT: AuditLog[] = [
  { id: "a1", createdAt: "2026-04-20 21:32:14", actor: "山田（店長）", action: "customer.edit", targetTable: "customers", targetId: "a8f3d9c2", ip: "210.1.2.3" },
  { id: "a2", createdAt: "2026-04-20 21:28:02", actor: "山田（店長）", action: "tip.manual_adjust", targetTable: "tip_transactions", targetId: "b4c9d2f1", ip: "210.1.2.3" },
  { id: "a3", createdAt: "2026-04-20 20:15:44", actor: "鈴木（スタッフ）", action: "customer.view", targetTable: "customers", targetId: "c2e5a9f3", ip: "192.168.0.5" },
  { id: "a4", createdAt: "2026-04-20 19:40:11", actor: "オーナー", action: "point_rule.update", targetTable: "point_rules", targetId: "r2", ip: "203.0.113.8" },
  { id: "a5", createdAt: "2026-04-20 18:55:38", actor: "オーナー", action: "customer.export", targetTable: "customers", targetId: "-", ip: "203.0.113.8" },
  { id: "a6", createdAt: "2026-04-19 23:12:09", actor: "オーナー", action: "customer.delete", targetTable: "customers", targetId: "z99-deleted", ip: "203.0.113.8" },
];

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
    <div className="space-y-4 max-w-5xl">
      <div className="px-4 py-3 bg-[#e8f5f0] border border-[#3a8f7c]/20 rounded-[6px] text-[12px] text-[#2e7d5b] flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          監査ログはオーナー権限のみ閲覧可能です。個人情報の閲覧・編集・削除・エクスポートは全て記録されます。
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={() => setFilter("all")} className={`px-3 py-1.5 text-[12px] rounded-[6px] ${filter === "all" ? "bg-[#2c3e50] text-white" : "text-[#5a6977] hover:bg-[#f3f0ec]"}`}>
          すべて
        </button>
        <button onClick={() => setFilter("sensitive")} className={`px-3 py-1.5 text-[12px] rounded-[6px] ${filter === "sensitive" ? "bg-[#c0392b] text-white" : "text-[#5a6977] hover:bg-[#f3f0ec]"}`}>
          重要操作のみ
        </button>
        <span className="ml-auto text-[11px] text-[#8e9baa]">{rows.length}件</span>
      </div>

      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[#e8e4df]">
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">日時</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">実行者</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">操作</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">対象</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">IP</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const meta = ACTION_META[r.action] ?? { icon: <FileText className="w-3 h-3" />, color: "#5a6977", label: r.action };
            return (
              <tr key={r.id} className="border-b border-[#f3f0ec] hover:bg-[#faf8f5]">
                <td className="px-3 py-2 font-mono text-[11px] text-[#5a6977]">{r.createdAt}</td>
                <td className="px-3 py-2 flex items-center gap-1 text-[#2c3e50]">
                  <User className="w-3 h-3 text-[#8e9baa]" />
                  {r.actor}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: meta.color }}>
                    {meta.icon}{meta.label}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-[#5a6977]">
                  {r.targetTable} / {r.targetId}
                </td>
                <td className="px-3 py-2 font-mono text-[11px] text-[#8e9baa]">{r.ip}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
