"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Plus, Pencil, X, Search } from "lucide-react";
import { usePersisted } from "@/lib/persist/store";
import { staffStore } from "@/lib/store/domain-stores";
import { staffFullName, type StaffFull } from "@/lib/staff-data";

type StaffStatus = "active" | "leave" | "retired";

interface Staff {
  id: string; name: string; role: string; hourlyWage: number;
  phone: string; status: StaffStatus; joinDate: string;
}

const ROLES = ["ディーラー", "フロア", "マネージャー", "キッチン"];

const STATUS_LABEL: Record<StaffStatus, string> = { active: "在籍", leave: "休職", retired: "退職" };
const STATUS_CHIP: Record<StaffStatus, string> = { active: "chip-success", leave: "chip-warning", retired: "chip-neutral" };

// ひらがな⇔カタカナ吸収
function normalizeJa(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export default function StaffPage() {
  const [staffFullList, setStaffFullList] = usePersisted(staffStore);
  // 一覧表示用に簡易型へ変換
  const staffList: Staff[] = useMemo(() => staffFullList.map(s => ({
    id: s.id,
    name: staffFullName(s),
    role: s.role,
    hourlyWage: s.hourlyWage || (s.salaryType === "monthly" ? Math.round(s.baseSalary / 160) : 0),
    phone: s.phone,
    status: s.status,
    joinDate: s.joinDate.replace(/-/g, "/").slice(0, 7),
  })), [staffFullList]);

  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "ディーラー", hourlyWage: 1200, phone: "" });
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | StaffStatus>("all");

  const activeCount = staffList.filter(s => s.status === "active").length;
  const leaveCount = staffList.filter(s => s.status === "leave").length;
  const retiredCount = staffList.filter(s => s.status === "retired").length;

  const q = normalizeJa(search.trim());
  const filtered = staffList.filter(s => {
    if (roleFilter !== "all" && s.role !== roleFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (!q) return true;
    return normalizeJa(s.name).includes(q) || s.phone.includes(search) || normalizeJa(s.role).includes(q);
  });

  function saveEdit() {
    if (!editId) return;
    setStaffFullList((prev: StaffFull[]) => prev.map(s => {
      if (s.id !== editId) return s;
      const [lastName, ...rest] = form.name.split(" ");
      return {
        ...s,
        lastName: lastName ?? s.lastName,
        firstName: rest.join(" ") || s.firstName,
        role: form.role,
        hourlyWage: form.hourlyWage,
        phone: form.phone,
      };
    }));
    setEditId(null);
  }

  function setStatus(id: string, status: StaffStatus) {
    setStaffFullList((prev: StaffFull[]) => prev.map(s => s.id === id ? { ...s, status } : s));
  }

  return (
    <div className="page-stack">
      {/* KPI */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-10 flex-wrap">
            <KpiItem label="従業員" value={staffList.length} unit="名" />
            <KpiItem label="在籍" value={activeCount} unit="名" accent />
            <KpiItem label="休職" value={leaveCount} unit="名" />
            <KpiItem label="退職" value={retiredCount} unit="名" />
          </div>
          <Link href="/g8n4vr/q9m4tx" className="btn btn-primary">
            <Plus className="w-3.5 h-3.5" />従業員登録
          </Link>
        </div>
      </section>

      {/* 検索 + 一覧 */}
      <section className="glass-panel">
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none z-10" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="名前・役割・電話番号で検索"
              style={{ paddingLeft: "40px" }}
            />
          </div>
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="text-[13px] max-w-[140px]">
            <option value="all">役割: すべて</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as "all" | StaffStatus)} className="text-[13px] max-w-[140px]">
            <option value="all">状態: すべて</option>
            <option value="active">在籍</option>
            <option value="leave">休職</option>
            <option value="retired">退職</option>
          </select>
          <span className="ml-auto t-xs text-text-tertiary">{filtered.length}件</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>名前</th>
              <th>役割</th>
              <th>時給</th>
              <th>電話番号</th>
              <th>入社</th>
              <th>状態</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="!py-10 text-center text-text-tertiary text-[13px]">該当する従業員がいません</td></tr>
            ) : filtered.map(s => (
              <tr key={s.id}>
                <td>
                  <Link href={`/g8n4vr/${s.id}`} className="font-medium text-text-primary hover:text-accent transition-colors">
                    {s.name}
                  </Link>
                </td>
                <td className="text-text-secondary">{s.role}</td>
                <td className="text-text-secondary">¥{s.hourlyWage.toLocaleString()}</td>
                <td className="text-text-secondary text-[12px]">{s.phone || "—"}</td>
                <td className="text-text-tertiary text-[12px]">{s.joinDate}</td>
                <td>
                  <span className={`chip ${STATUS_CHIP[s.status]} chip-sm`}>
                    {STATUS_LABEL[s.status]}
                  </span>
                </td>
                <td>
                  <div className="flex gap-1 flex-wrap">
                    <button onClick={() => { setEditId(s.id); setForm({ name: s.name, role: s.role, hourlyWage: s.hourlyWage, phone: s.phone }); }}
                      className="btn btn-subtle btn-xs"><Pencil className="w-3 h-3" />編集</button>
                    {s.status !== "active" && (
                      <button onClick={() => setStatus(s.id, "active")} className="btn btn-subtle btn-xs">復帰</button>
                    )}
                    {s.status !== "leave" && (
                      <button onClick={() => setStatus(s.id, "leave")} className="btn btn-ghost btn-xs">休職</button>
                    )}
                    {s.status !== "retired" && (
                      <button onClick={() => setStatus(s.id, "retired")} className="btn btn-danger btn-xs">退職</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 編集モーダル */}
      {editId && (
        <div className="modal-overlay z-50" onClick={() => setEditId(null)}>
          <div className="bg-white rounded-[8px] w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[14px] font-semibold">従業員編集</p>
              <button onClick={() => setEditId(null)} className="p-1 hover:bg-bg-hover rounded-[4px]"><X className="w-4 h-4 text-text-tertiary" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="t-label">名前</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 text-[13px]" />
              </div>
              <div>
                <label className="t-label">役割</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="mt-1 text-[13px]">
                  {ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="t-label">時給</label>
                <input type="number" value={form.hourlyWage} onChange={e => setForm(f => ({ ...f, hourlyWage: parseInt(e.target.value) || 0 }))} className="mt-1 text-[13px]" />
              </div>
              <div>
                <label className="t-label">電話番号</label>
                <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 text-[13px]" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-light hover:text-[#157a58]">保存</button>
              <button onClick={() => setEditId(null)} className="px-4 py-2.5 border border-border text-[13px] rounded-[6px] hover:bg-bg-hover">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KpiItem({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value" style={{ color: accent ? "var(--primary-text)" : "var(--text-primary)" }}>{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
    </div>
  );
}
