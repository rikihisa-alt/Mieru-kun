"use client";

import { useState } from "react";
import { Clock, Check, AlertCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface StaffRecord {
  id: string; name: string; role: string;
  clockIn: string | null; clockOut: string | null;
  breakMin: number; workMin: number | null;
  status: "working" | "on_break" | "finished" | "off";
  needsApproval: boolean; modifyReason: string | null;
}

const STAFF: StaffRecord[] = [
  { id: "s1", name: "山田 太郎", role: "ディーラー", clockIn: "18:00", clockOut: null, breakMin: 0, workMin: null, status: "working", needsApproval: false, modifyReason: null },
  { id: "s2", name: "鈴木 一郎", role: "ディーラー", clockIn: "18:00", clockOut: null, breakMin: 30, workMin: null, status: "on_break", needsApproval: false, modifyReason: null },
  { id: "s3", name: "佐藤 花", role: "フロア", clockIn: "17:30", clockOut: "23:30", breakMin: 60, workMin: 300, status: "finished", needsApproval: false, modifyReason: null },
  { id: "s4", name: "高橋 健", role: "ディーラー", clockIn: "18:15", clockOut: "23:00", breakMin: 30, workMin: 255, status: "finished", needsApproval: true, modifyReason: "打刻忘れ修正" },
  { id: "s5", name: "伊藤 美咲", role: "フロア", clockIn: null, clockOut: null, breakMin: 0, workMin: null, status: "off", needsApproval: false, modifyReason: null },
];

const SHIFTS = [
  { name: "山田 太郎", slots: [null, "18-24", "18-24", null, "18-24", "18-24", "18-24"] },
  { name: "鈴木 一郎", slots: ["18-24", "18-24", null, "18-24", "18-24", null, "18-24"] },
  { name: "佐藤 花", slots: ["17-23", null, "17-23", "17-23", null, "17-23", "17-23"] },
  { name: "高橋 健", slots: ["18-24", "18-24", "18-24", null, null, "18-24", "18-24"] },
  { name: "伊藤 美咲", slots: [null, "17-23", "17-23", "17-23", "17-23", null, null] },
];

const DAYS = ["月", "火", "水", "木", "金", "土", "日"];

export default function AttendancePage() {
  const [staff, setStaff] = useState(STAFF);
  const [tab, setTab] = useState<"today" | "shift">("today");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editReason, setEditReason] = useState("");

  function approve(id: string) {
    setStaff((prev) => prev.map((s) => s.id === id ? { ...s, needsApproval: false } : s));
  }

  function submitModify() {
    if (!editId || !editReason) return;
    setStaff((prev) => prev.map((s) => s.id === editId ? { ...s, clockOut: editTime || s.clockOut, modifyReason: editReason, needsApproval: true } : s));
    setEditId(null); setEditTime(""); setEditReason("");
  }

  const working = staff.filter((s) => s.status === "working").length;
  const onBreak = staff.filter((s) => s.status === "on_break").length;
  const pending = staff.filter((s) => s.needsApproval).length;

  return (
    <div className="space-y-4 max-w-5xl">
      {/* タブ */}
      <div className="flex items-center gap-1">
        <button onClick={() => setTab("today")} className={`px-3 py-1.5 text-[12px] font-medium rounded-[var(--radius)] ${tab === "today" ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-hover"}`}>
          <Clock className="w-3 h-3 inline mr-1" />本日の勤怠
        </button>
        <button onClick={() => setTab("shift")} className={`px-3 py-1.5 text-[12px] font-medium rounded-[var(--radius)] ${tab === "shift" ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-hover"}`}>
          <Calendar className="w-3 h-3 inline mr-1" />シフト
        </button>
      </div>

      {tab === "today" ? (
        <>
          {/* サマリー */}
          <div className="flex items-center gap-4 text-[12px]">
            <span className="text-text-secondary">出勤 <strong className="text-status-success">{working}</strong></span>
            <span className="text-text-secondary">休憩 <strong className="text-status-warning">{onBreak}</strong></span>
            {pending > 0 && <span className="flex items-center gap-1 text-status-danger"><AlertCircle className="w-3 h-3" />承認待ち {pending}</span>}
          </div>

          {/* テーブル */}
          <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-border bg-bg">
                <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">スタッフ</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">役割</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">出勤</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">退勤</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">休憩</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">勤務</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">状態</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">操作</th>
              </tr></thead>
              <tbody>{staff.map((s) => (
                <tr key={s.id} className={`border-b border-border-light ${s.needsApproval ? "bg-status-warning-bg/30" : ""}`}>
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-text-secondary text-[12px]">{s.role}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{s.clockIn ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{s.clockOut ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[12px]">{s.breakMin > 0 ? `${s.breakMin}分` : "—"}</td>
                  <td className="px-4 py-2.5 text-[12px] font-medium">{s.workMin != null ? `${Math.floor(s.workMin / 60)}h${s.workMin % 60}m` : "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)] ${
                      s.status === "working" ? "bg-status-success-bg text-status-success" :
                      s.status === "on_break" ? "bg-status-warning-bg text-status-warning" :
                      s.status === "finished" ? "bg-[#e8f0fe] text-accent" : "bg-bg text-text-tertiary"
                    }`}>
                      {s.status === "working" ? "勤務中" : s.status === "on_break" ? "休憩中" : s.status === "finished" ? "退勤済" : "未出勤"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 space-x-1">
                    {s.needsApproval && (
                      <button onClick={() => approve(s.id)} className="px-2 py-0.5 text-[11px] text-status-success bg-status-success-bg rounded-[var(--radius-sm)] hover:bg-green-200"><Check className="w-3 h-3 inline" /> 承認</button>
                    )}
                    {s.status !== "off" && (
                      <button onClick={() => { setEditId(s.id); setEditTime(s.clockOut ?? ""); }} className="px-2 py-0.5 text-[11px] text-text-secondary hover:bg-bg-hover rounded-[var(--radius-sm)]">修正</button>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          {/* 修正モーダル（インライン） */}
          {editId && (
            <div className="bg-bg-white border border-accent/30 rounded-[var(--radius-lg)] p-4 space-y-3">
              <h3 className="text-[13px] font-semibold">勤怠修正: {staff.find((s) => s.id === editId)?.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">退勤時刻</label><input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} className="mt-1" /></div>
                <div><label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">修正理由 *</label><input type="text" value={editReason} onChange={(e) => setEditReason(e.target.value)} className="mt-1" placeholder="打刻忘れ修正など" /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={submitModify} disabled={!editReason} className="px-4 py-[7px] bg-accent text-white text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover disabled:opacity-50">修正を申請</button>
                <button onClick={() => setEditId(null)} className="px-4 py-[7px] border border-border text-[13px] rounded-[var(--radius)] hover:bg-bg-hover">キャンセル</button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* シフト表 */
        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] overflow-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <button className="p-1 hover:bg-bg-hover rounded-[var(--radius)]"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[13px] font-semibold">4月14日〜4月20日</span>
            <button className="p-1 hover:bg-bg-hover rounded-[var(--radius)]"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-border bg-bg">
              <th className="px-4 py-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider w-32">スタッフ</th>
              {DAYS.map((d) => <th key={d} className="px-2 py-2 text-center text-[11px] font-semibold text-text-tertiary uppercase">{d}</th>)}
            </tr></thead>
            <tbody>{SHIFTS.map((s) => (
              <tr key={s.name} className="border-b border-border-light">
                <td className="px-4 py-2 font-medium">{s.name}</td>
                {s.slots.map((slot, i) => (
                  <td key={i} className="px-2 py-2 text-center">
                    {slot ? <span className="inline-block px-2 py-1 bg-accent-light text-accent text-[10px] font-medium rounded-[var(--radius-sm)]">{slot}</span>
                    : <span className="text-text-tertiary">—</span>}
                  </td>
                ))}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
