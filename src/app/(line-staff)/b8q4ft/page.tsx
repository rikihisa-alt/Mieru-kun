"use client";

import { useState, useEffect } from "react";
import { attendanceAction, getAttendanceStatus } from "@/lib/actions/attendance-actions";
import type { AttendanceLog } from "@/types/database";
import { formatTime, formatMinutes } from "@/lib/utils";
import { Play, Square, Coffee, Pause } from "lucide-react";

export default function ClockPage() {
  const [att, setAtt] = useState<AttendanceLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    try { setAtt(await getAttendanceStatus()); } catch { /* demo */ }
  }

  async function act(action: string) {
    setLoading(true); setMsg("");
    const fd = new FormData(); fd.set("action", action);
    const r = await attendanceAction(fd);
    if (r.error) setMsg(r.error);
    else { setMsg("完了"); await load(); }
    setLoading(false);
    setTimeout(() => setMsg(""), 2000);
  }

  const status = att?.status;
  const isWorking = status === "working";
  const isBreak = status === "on_break";
  const notStarted = !att || status === "finished";

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* 時計 */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-5 text-center">
        <p className="text-[32px] font-bold font-mono text-text-primary tracking-tight">
          {now.toLocaleTimeString("ja-JP")}
        </p>
        <p className="text-[12px] text-text-tertiary mt-1">
          {now.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
        </p>
      </div>

      {/* ステータス */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[12px] text-text-tertiary">ステータス</span>
          <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)] ${
            isWorking ? "bg-status-success-bg text-status-success" :
            isBreak ? "bg-status-warning-bg text-status-warning" :
            notStarted && att?.status === "finished" ? "bg-[#e8f5f0] text-accent" :
            "bg-bg text-text-tertiary"
          }`}>
            {isWorking ? "勤務中" : isBreak ? "休憩中" : att?.status === "finished" ? "退勤済" : "未出勤"}
          </span>
        </div>
        {att?.clock_in && (
          <div className="space-y-1.5 text-[12px]">
            <div className="flex justify-between"><span className="text-text-tertiary">出勤</span><span className="font-medium">{formatTime(att.clock_in)}</span></div>
            {att.clock_out && <div className="flex justify-between"><span className="text-text-tertiary">退勤</span><span className="font-medium">{formatTime(att.clock_out)}</span></div>}
            {(att.break_minutes ?? 0) > 0 && <div className="flex justify-between"><span className="text-text-tertiary">休憩</span><span>{formatMinutes(att.break_minutes)}</span></div>}
            {att.work_minutes != null && <div className="flex justify-between"><span className="text-text-tertiary">勤務時間</span><span className="font-bold">{formatMinutes(att.work_minutes)}</span></div>}
          </div>
        )}
      </div>

      {/* アクション */}
      <div className="space-y-2">
        {notStarted && (
          <Btn onClick={() => act("clock_in")} loading={loading} icon={<Play />} label="出勤する" primary />
        )}
        {isWorking && (
          <>
            <Btn onClick={() => act("break_start")} loading={loading} icon={<Coffee />} label="休憩開始" />
            <Btn onClick={() => act("clock_out")} loading={loading} icon={<Square />} label="退勤する" danger />
          </>
        )}
        {isBreak && (
          <Btn onClick={() => act("break_end")} loading={loading} icon={<Pause />} label="休憩終了" primary />
        )}
      </div>

      {msg && <p className={`text-center text-[12px] ${msg === "完了" ? "text-status-success" : "text-status-danger"}`}>{msg}</p>}
    </div>
  );
}

function Btn({ onClick, loading, icon, label, primary, danger }: {
  onClick: () => void; loading: boolean; icon: React.ReactNode; label: string; primary?: boolean; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-3 text-[14px] font-medium rounded-[var(--radius)] transition-colors disabled:opacity-50 ${
        primary ? "bg-accent text-text-inverse hover:bg-accent-hover" :
        danger ? "bg-status-danger text-text-inverse hover:bg-red-700" :
        "bg-bg-white border border-border text-text-primary hover:bg-bg-hover"
      }`}
    >
      <span className="[&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      {label}
    </button>
  );
}
