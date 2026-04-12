"use client";

import { useState } from "react";
import { Clock, Check, AlertCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface StaffRecord {
  id: string; name: string; role: string;
  clockIn: string | null; clockOut: string | null;
  breakMin: number; workMin: number | null;
  status: "working" | "on_break" | "finished" | "off";
  needsApproval: boolean;
}

const STAFF: StaffRecord[] = [
  { id: "s1", name: "山田 太郎", role: "ディーラー", clockIn: "18:00", clockOut: null, breakMin: 0, workMin: null, status: "working", needsApproval: false },
  { id: "s2", name: "鈴木 一郎", role: "ディーラー", clockIn: "18:00", clockOut: null, breakMin: 30, workMin: null, status: "on_break", needsApproval: false },
  { id: "s3", name: "佐藤 花", role: "フロア", clockIn: "17:30", clockOut: "23:30", breakMin: 60, workMin: 300, status: "finished", needsApproval: false },
  { id: "s4", name: "高橋 健", role: "ディーラー", clockIn: "18:15", clockOut: "23:00", breakMin: 30, workMin: 255, status: "finished", needsApproval: true },
  { id: "s5", name: "伊藤 美咲", role: "フロア", clockIn: null, clockOut: null, breakMin: 0, workMin: null, status: "off", needsApproval: false },
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
    setStaff(prev => prev.map(s => s.id === id ? { ...s, needsApproval: false } : s));
  }
  function submitModify() {
    if (!editId || !editReason) return;
    setStaff(prev => prev.map(s => s.id === editId ? { ...s, clockOut: editTime || s.clockOut, needsApproval: true } : s));
    setEditId(null); setEditTime(""); setEditReason("");
  }

  const working = staff.filter(s => s.status === "working").length;
  const onBreak = staff.filter(s => s.status === "on_break").length;
  const pending = staff.filter(s => s.needsApproval).length;

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center gap-1">
        <button onClick={() => setTab("today")} className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] ${tab === "today" ? "bg-[#1a73e8] text-white" : "text-[#5f6368] hover:bg-[#f0f1f3]"}`}>
          <Clock className="w-3 h-3 inline mr-1" />本日の勤怠
        </button>
        <button onClick={() => setTab("shift")} className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] ${tab === "shift" ? "bg-[#1a73e8] text-white" : "text-[#5f6368] hover:bg-[#f0f1f3]"}`}>
          <Calendar className="w-3 h-3 inline mr-1" />シフト
        </button>
        {tab === "today" && (
          <div className="ml-auto flex items-center gap-3 text-[12px]">
            <span className="text-[#5f6368]">出勤 <strong className="text-[#188038]">{working}</strong></span>
            <span className="text-[#5f6368]">休憩 <strong className="text-[#e37400]">{onBreak}</strong></span>
            {pending > 0 && <span className="flex items-center gap-1 text-[#d93025]"><AlertCircle className="w-3 h-3" />承認待ち {pending}</span>}
          </div>
        )}
      </div>

      {tab === "today" ? (
        <>
          <div className="bg-white border border-[#dadce0] rounded-[8px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-[#dadce0] bg-[#f5f6f8]">
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider text-left">スタッフ</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider text-left">役割</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider text-left">出勤</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider text-left">退勤</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider text-left">休憩</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider text-left">勤務</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider text-left">状態</th>
                <th className="px-4 py-2.5 text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider text-left">操作</th>
              </tr></thead>
              <tbody>{staff.map(s => (
                <tr key={s.id} className={`border-b border-[#e8eaed] ${s.needsApproval ? "bg-[#fef7e0]/30" : ""}`}>
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-[#5f6368] text-[12px]">{s.role}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{s.clockIn ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{s.clockOut ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[12px]">{s.breakMin > 0 ? `${s.breakMin}分` : "—"}</td>
                  <td className="px-4 py-2.5 text-[12px] font-medium">{s.workMin != null ? `${Math.floor(s.workMin / 60)}h${s.workMin % 60}m` : "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-[4px] ${
                      s.status === "working" ? "bg-[#e6f4ea] text-[#188038]" :
                      s.status === "on_break" ? "bg-[#fef7e0] text-[#e37400]" :
                      s.status === "finished" ? "bg-[#e8f0fe] text-[#1a73e8]" : "bg-[#f5f6f8] text-[#9aa0a6]"
                    }`}>
                      {s.status === "working" ? "勤務中" : s.status === "on_break" ? "休憩中" : s.status === "finished" ? "退勤済" : "未出勤"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 space-x-1">
                    {s.needsApproval && <button onClick={() => approve(s.id)} className="px-2 py-0.5 text-[11px] text-[#188038] bg-[#e6f4ea] rounded-[4px] hover:bg-green-200"><Check className="w-3 h-3 inline" /> 承認</button>}
                    {s.status !== "off" && <button onClick={() => { setEditId(s.id); setEditTime(s.clockOut ?? ""); }} className="px-2 py-0.5 text-[11px] text-[#5f6368] hover:bg-[#f0f1f3] rounded-[4px]">修正</button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {editId && (
            <div className="bg-white border border-[#1a73e8]/30 rounded-[8px] p-4 space-y-3">
              <h3 className="text-[13px] font-semibold">勤怠修正: {staff.find(s => s.id === editId)?.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-[#9aa0a6] font-semibold uppercase tracking-wider">退勤時刻</label><input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="mt-1" /></div>
                <div><label className="text-[11px] text-[#9aa0a6] font-semibold uppercase tracking-wider">修正理由 *</label><input type="text" value={editReason} onChange={e => setEditReason(e.target.value)} className="mt-1" placeholder="打刻忘れ修正など" /></div>
              </div>
              <div className="flex gap-2">
                <button onClick={submitModify} disabled={!editReason} className="px-4 py-[7px] bg-[#1a73e8] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#1557b0] disabled:opacity-50">修正を申請</button>
                <button onClick={() => setEditId(null)} className="px-4 py-[7px] border border-[#dadce0] text-[13px] rounded-[6px] hover:bg-[#f0f1f3]">キャンセル</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-[#dadce0] rounded-[8px] overflow-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8eaed]">
            <button className="p-1 hover:bg-[#f0f1f3] rounded-[4px]"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[13px] font-semibold">4月14日〜4月20日</span>
            <button className="p-1 hover:bg-[#f0f1f3] rounded-[4px]"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-[#dadce0] bg-[#f5f6f8]">
              <th className="px-4 py-2 text-[11px] font-semibold text-[#9aa0a6] uppercase text-left w-32">スタッフ</th>
              {DAYS.map(d => <th key={d} className="px-2 py-2 text-center text-[11px] font-semibold text-[#9aa0a6] uppercase">{d}</th>)}
            </tr></thead>
            <tbody>{SHIFTS.map(s => (
              <tr key={s.name} className="border-b border-[#e8eaed]">
                <td className="px-4 py-2 font-medium">{s.name}</td>
                {s.slots.map((slot, i) => (
                  <td key={i} className="px-2 py-2 text-center">
                    {slot ? <span className="inline-block px-2 py-1 bg-[#e8f0fe] text-[#1a73e8] text-[10px] font-medium rounded-[4px]">{slot}</span> : <span className="text-[#9aa0a6]">—</span>}
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
