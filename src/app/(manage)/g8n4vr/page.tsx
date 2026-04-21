"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Pencil, X, ArrowUpRight } from "lucide-react";

interface Staff {
  id: string; name: string; role: string; hourlyWage: number;
  phone: string; status: "active" | "inactive"; joinDate: string;
}

const ROLES = ["ディーラー", "フロア", "マネージャー", "キッチン"];

const INIT: Staff[] = [
  { id: "s1", name: "山田 太郎", role: "ディーラー", hourlyWage: 1500, phone: "090-1111-2222", status: "active", joinDate: "2024/04" },
  { id: "s2", name: "鈴木 一郎", role: "ディーラー", hourlyWage: 1500, phone: "090-2222-3333", status: "active", joinDate: "2024/06" },
  { id: "s3", name: "佐藤 花", role: "フロア", hourlyWage: 1200, phone: "090-3333-4444", status: "active", joinDate: "2025/01" },
  { id: "s4", name: "高橋 健", role: "ディーラー", hourlyWage: 1500, phone: "090-4444-5555", status: "active", joinDate: "2024/09" },
  { id: "s5", name: "伊藤 美咲", role: "フロア", hourlyWage: 1200, phone: "090-5555-6666", status: "active", joinDate: "2025/03" },
  { id: "s6", name: "中村 翔", role: "マネージャー", hourlyWage: 2000, phone: "090-6666-7777", status: "inactive", joinDate: "2023/08" },
];

export default function StaffPage() {
  const [staffList, setStaffList] = useState<Staff[]>(INIT);
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", role: "ディーラー", hourlyWage: 1200, phone: "" });

  const activeCount = staffList.filter(s => s.status === "active").length;

  function addStaff() {
    if (!form.name.trim()) return;
    setStaffList(prev => [...prev, {
      id: `s${Date.now()}`, name: form.name, role: form.role,
      hourlyWage: form.hourlyWage, phone: form.phone,
      status: "active", joinDate: new Date().toISOString().slice(0, 7).replace("-", "/"),
    }]);
    setForm({ name: "", role: "ディーラー", hourlyWage: 1200, phone: "" });
    setShowAdd(false);
  }

  function saveEdit() {
    if (!editId) return;
    setStaffList(prev => prev.map(s => s.id === editId ? { ...s, ...form } : s));
    setEditId(null);
  }

  function toggleStatus(id: string) {
    setStaffList(prev => prev.map(s => s.id === id ? { ...s, status: s.status === "active" ? "inactive" : "active" } : s));
  }

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className="flex items-center gap-6 pb-4 border-b border-border-light">
        <div className="flex items-center gap-1.5">
          <span className="text-text-tertiary text-[13px]">従業員数</span>
          <span className="text-[15px] font-bold text-text-primary">{staffList.length}名</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-text-tertiary text-[13px]">在籍</span>
          <span className="text-[15px] font-bold text-accent">{activeCount}名</span>
        </div>
        <button onClick={() => { setShowAdd(true); setForm({ name: "", role: "ディーラー", hourlyWage: 1200, phone: "" }); }}
          className="ml-auto flex items-center gap-1 px-3 py-[7px] bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover">
          <Plus className="w-3.5 h-3.5" />従業員追加
        </button>
      </div>

      {/* 追加フォーム */}
      {showAdd && (
        <div className="pb-4 border-b border-border-light space-y-3">
          <p className="t-subhead">従業員追加</p>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="t-label">名前 *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="名前" className="mt-1 text-[13px]" />
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
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="090-0000-0000" className="mt-1 text-[13px]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={addStaff} className="px-4 py-[7px] bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover">追加</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-[7px] border border-border text-[13px] rounded-[6px] hover:bg-bg-hover">キャンセル</button>
          </div>
        </div>
      )}

      {/* 一覧 */}
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border-light">
            <th className="pb-2 data-th">名前</th>
            <th className="pb-2 data-th">役割</th>
            <th className="pb-2 data-th">時給</th>
            <th className="pb-2 data-th">電話番号</th>
            <th className="pb-2 data-th">入社</th>
            <th className="pb-2 data-th">状態</th>
            <th className="pb-2 data-th">操作</th>
          </tr>
        </thead>
        <tbody>
          {staffList.map(s => (
            <tr key={s.id} className="border-b border-border-light hover:bg-bg-hover transition-colors">
              <td className="py-2.5 font-medium text-text-primary">{s.name}</td>
              <td className="py-2.5 text-text-secondary">{s.role}</td>
              <td className="py-2.5 text-text-secondary">¥{s.hourlyWage.toLocaleString()}</td>
              <td className="py-2.5 text-text-secondary text-[12px]">{s.phone || "—"}</td>
              <td className="py-2.5 text-text-tertiary text-[12px]">{s.joinDate}</td>
              <td className="py-2.5">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[3px] ${s.status === "active" ? "bg-accent-light text-status-success" : "bg-bg-hover text-text-tertiary"}`}>
                  {s.status === "active" ? "在籍" : "退職"}
                </span>
              </td>
              <td className="py-2.5">
                <div className="flex gap-1">
                  <button onClick={() => { setEditId(s.id); setForm({ name: s.name, role: s.role, hourlyWage: s.hourlyWage, phone: s.phone }); }}
                    className="px-2 py-0.5 text-[11px] text-accent hover:bg-accent-light rounded-[4px]"><Pencil className="w-3 h-3 inline" /> 編集</button>
                  <button onClick={() => toggleStatus(s.id)}
                    className={`px-2 py-0.5 text-[11px] rounded-[4px] ${s.status === "active" ? "text-text-tertiary hover:bg-bg-hover" : "text-accent hover:bg-accent-light"}`}>
                    {s.status === "active" ? "退職" : "復帰"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 編集モーダル */}
      {editId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setEditId(null)}>
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
              <button onClick={saveEdit} className="flex-1 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover">保存</button>
              <button onClick={() => setEditId(null)} className="px-4 py-2.5 border border-border text-[13px] rounded-[6px] hover:bg-bg-hover">キャンセル</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
