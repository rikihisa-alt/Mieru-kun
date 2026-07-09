"use client";

import { useState, useEffect, useCallback } from "react";
import { attendanceAction, getAttendanceStatus } from "@/lib/actions/attendance-actions";
import type { AttendanceLog } from "@/types/database";
import { formatTime, formatMinutes } from "@/lib/utils";
import { Play, Square, Coffee, Pause } from "lucide-react";

export default function ClockPage() {
  const [att, setAtt] = useState<AttendanceLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    try { setAtt(await getAttendanceStatus()); } catch { /* demo */ }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect -- 勤怠状況取得 + 時計表示 */
  useEffect(() => {
    load();
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [load]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function act(action: string) {
    if (action === "clock_out" && !confirm("退勤しますか？")) return;
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
    <div className="ln-page">
      <div className="ln-stack">
        {/* 時計 */}
        <div className="ln-card ln-card-lg" style={{ textAlign: "center" }}>
          <p className="ln-num" style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
            {now.toLocaleTimeString("ja-JP")}
          </p>
          <p className="ln-mute" style={{ fontSize: 12, marginTop: 4 }}>
            {now.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" })}
          </p>
        </div>

        {/* ステータス */}
        <div className="ln-card">
          <div className="ln-spread" style={{ marginBottom: 12 }}>
            <span className="ln-mute" style={{ fontSize: 12 }}>ステータス</span>
            <span
              className={
                isWorking ? "ln-chip ln-chip--success" :
                isBreak ? "ln-chip ln-chip--warn" :
                att?.status === "finished" ? "ln-chip ln-chip--success" :
                "ln-chip"
              }
            >
              {isWorking ? "勤務中" : isBreak ? "休憩中" : att?.status === "finished" ? "退勤済" : "未出勤"}
            </span>
          </div>
          {att?.clock_in && (
            <div className="ln-stack-sm" style={{ fontSize: 12, gap: 6 }}>
              <div className="ln-spread"><span className="ln-mute">出勤</span><span style={{ fontWeight: 500 }}>{formatTime(att.clock_in)}</span></div>
              {att.clock_out && <div className="ln-spread"><span className="ln-mute">退勤</span><span style={{ fontWeight: 500 }}>{formatTime(att.clock_out)}</span></div>}
              {(att.break_minutes ?? 0) > 0 && <div className="ln-spread"><span className="ln-mute">休憩</span><span>{formatMinutes(att.break_minutes)}</span></div>}
              {att.work_minutes != null && <div className="ln-spread"><span className="ln-mute">勤務時間</span><span style={{ fontWeight: 700 }}>{formatMinutes(att.work_minutes)}</span></div>}
            </div>
          )}
        </div>

        {/* アクション */}
        <div className="ln-stack-sm">
          {notStarted && (
            <ActBtn onClick={() => act("clock_in")} loading={loading} icon={<Play size={16} />} label="出勤する" variant="primary" />
          )}
          {isWorking && (
            <>
              <ActBtn onClick={() => act("break_start")} loading={loading} icon={<Coffee size={16} />} label="休憩開始" />
              <ActBtn onClick={() => act("clock_out")} loading={loading} icon={<Square size={16} />} label="退勤する" variant="danger" />
            </>
          )}
          {isBreak && (
            <ActBtn onClick={() => act("break_end")} loading={loading} icon={<Pause size={16} />} label="休憩終了" variant="primary" />
          )}
        </div>

        {msg && (
          <p style={{ textAlign: "center", fontSize: 12, color: msg === "完了" ? "var(--ln-accent-text)" : "var(--ln-danger)" }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

function ActBtn({ onClick, loading, icon, label, variant }: {
  onClick: () => void; loading: boolean; icon: React.ReactNode; label: string; variant?: "primary" | "danger";
}) {
  const cls =
    variant === "primary" ? "ln-btn ln-btn--primary ln-btn--full ln-btn--lg" :
    variant === "danger" ? "ln-btn ln-btn--full ln-btn--lg" :
    "ln-btn ln-btn--full ln-btn--lg";
  const customStyle =
    variant === "danger"
      ? { background: "var(--ln-danger)", borderColor: "var(--ln-danger)", color: "var(--ln-card)" }
      : undefined;
  return (
    <button onClick={onClick} disabled={loading} className={cls} style={{ opacity: loading ? 0.5 : 1, ...customStyle }}>
      {icon}
      {label}
    </button>
  );
}
