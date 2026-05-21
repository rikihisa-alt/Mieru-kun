"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, Check, AlertCircle, Calendar, ChevronLeft, ChevronRight, Plus, FileDown } from "lucide-react";

// ===== 型 =====
interface StaffRecord {
  id: string; name: string; role: string;
  clockIn: string | null; clockOut: string | null;
  breakMin: number; workMin: number | null;
  status: "working" | "on_break" | "finished" | "off";
  needsApproval: boolean;
}
interface BreakSpan { startQ: number; endQ: number; }
interface ShiftBar {
  staffId: string; date: string; startQ: number; endQ: number; // 15分単位 (0=14:00, 1=14:15 ...)
  breaks: BreakSpan[];
}

// ===== 定数(出荷状態: 空) =====
const STAFF_LIST: { id: string; name: string; role: string }[] = [];
const ATTENDANCE: StaffRecord[] = [];

// タイムライン: 14:00-26:00 → 48 quarters
const TL_START_H = 14;
const TL_END_H = 26;
const TOTAL_Q = (TL_END_H - TL_START_H) * 4; // 48
function qToTime(q: number): string {
  const h = TL_START_H + Math.floor(q / 4);
  const m = (q % 4) * 15;
  return `${h}:${m.toString().padStart(2, "0")}`;
}

// 日付ヘルパー
function dateStr(offset: number): string {
  const d = new Date(); d.setDate(d.getDate() + offset);
  return d.toISOString().split("T")[0];
}
function dateLabelShort(s: string): string {
  const d = new Date(s);
  const days = ["日","月","火","水","木","金","土"];
  return `${d.getMonth()+1}/${d.getDate()}(${days[d.getDay()]})`;
}

// 初期シフト(出荷状態: 空)
function makeInitShifts(): ShiftBar[] { return []; }

export default function AttendancePage() {
  const [staff, setStaff] = useState(ATTENDANCE);
  const [tab, setTab] = useState<"today" | "shift" | "create" | "calendar" | "history">("today");
  const [historyMonth, setHistoryMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });
  const [editId, setEditId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editReason, setEditReason] = useState("");

  // シフト
  const [shifts, setShifts] = useState<ShiftBar[]>(makeInitShifts);
  const [selectedDate, setSelectedDate] = useState(dateStr(0));
  const [dateOffset, setDateOffset] = useState(0);

  // ドラッグ作成用state
  const [dragging, setDragging] = useState<{ staffId: string; startQ: number; currentQ: number } | null>(null);
  const [resizing, setResizing] = useState<{ staffId: string; edge: "start" | "end"; origBar: ShiftBar } | null>(null);
  const [breakDragging, setBreakDragging] = useState<{ staffId: string; startQ: number; currentQ: number } | null>(null);
  const [breakMode, setBreakMode] = useState(false); // ダブルクリックで休憩モードON
  const [moving, setMoving] = useState<{ staffId: string; date: string; startMouseQ: number; origStartQ: number; origEndQ: number } | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  function approve(id: string) {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, needsApproval: false } : s));
  }
  function submitModify() {
    if (!editId || !editReason) return;
    setStaff(prev => prev.map(s => s.id === editId ? { ...s, clockOut: editTime || s.clockOut, needsApproval: true } : s));
    setEditId(null); setEditTime(""); setEditReason("");
  }

  // 日付切替
  function changeDate(dir: number) {
    const newOff = dateOffset + (dir * 7);
    setDateOffset(newOff);
    setSelectedDate(dateStr(newOff));
  }
  const dates = Array.from({ length: 7 }, (_, i) => dateStr(dateOffset + i - 3));

  // シフトCRUD
  function getBar(staffId: string, date: string) {
    return shifts.find(s => s.staffId === staffId && s.date === date);
  }
  function deleteBar(staffId: string, date: string) {
    setShifts(prev => prev.filter(s => !(s.staffId === staffId && s.date === date)));
  }

  // マウスからQ値を計算
  const getQFromMouse = useCallback((e: React.MouseEvent) => {
    if (!timelineRef.current) return 0;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const q = Math.round(ratio * TOTAL_Q);
    return Math.max(0, Math.min(TOTAL_Q, q));
  }, []);

  // ドラッグ作成: mousedown on empty area
  function handleTimelineMouseDown(staffId: string, e: React.MouseEvent) {
    if (getBar(staffId, selectedDate)) return; // 既存バーがある
    const q = getQFromMouse(e);
    setDragging({ staffId, startQ: q, currentQ: q });
  }
  function handleTimelineMouseMove(e: React.MouseEvent) {
    if (dragging) {
      const q = getQFromMouse(e);
      setDragging(prev => prev ? { ...prev, currentQ: q } : null);
    }
    if (breakDragging) {
      const q = getQFromMouse(e);
      setBreakDragging(prev => prev ? { ...prev, currentQ: q } : null);
    }
    if (moving) {
      const q = getQFromMouse(e);
      const delta = q - moving.startMouseQ;
      const duration = moving.origEndQ - moving.origStartQ;
      let newStart = moving.origStartQ + delta;
      let newEnd = moving.origEndQ + delta;
      if (newStart < 0) { newStart = 0; newEnd = duration; }
      if (newEnd > TOTAL_Q) { newEnd = TOTAL_Q; newStart = TOTAL_Q - duration; }
      setShifts(prev => prev.map(s => s.staffId === moving.staffId && s.date === moving.date ? { ...s, startQ: newStart, endQ: newEnd } : s));
    }
    if (resizing) {
      const q = getQFromMouse(e);
      const bar = resizing.origBar;
      if (resizing.edge === "end") {
        const newEnd = Math.max(bar.startQ + 1, q);
        setShifts(prev => prev.map(s => s.staffId === bar.staffId && s.date === bar.date ? { ...s, endQ: newEnd } : s));
      } else {
        const newStart = Math.min(bar.endQ - 1, q);
        setShifts(prev => prev.map(s => s.staffId === bar.staffId && s.date === bar.date ? { ...s, startQ: newStart } : s));
      }
    }
  }
  function handleTimelineMouseUp() {
    if (dragging) {
      const s = Math.min(dragging.startQ, dragging.currentQ);
      const e = Math.max(dragging.startQ, dragging.currentQ);
      if (e - s >= 1) {
        setShifts(prev => [...prev, { staffId: dragging.staffId, date: selectedDate, startQ: s, endQ: e, breaks: [] }]);
      }
      setDragging(null);
    }
    if (breakDragging) {
      const s = Math.min(breakDragging.startQ, breakDragging.currentQ);
      const e = Math.max(breakDragging.startQ, breakDragging.currentQ);
      if (e - s >= 1) {
        setShifts(prev => prev.map(bar => {
          if (bar.staffId !== breakDragging.staffId || bar.date !== selectedDate) return bar;
          // 休憩はバー範囲内に制限
          const bs = Math.max(bar.startQ, s);
          const be = Math.min(bar.endQ, e);
          if (be - bs < 1) return bar;
          return { ...bar, breaks: [...bar.breaks, { startQ: bs, endQ: be }] };
        }));
      }
      setBreakDragging(null);
    }
    if (resizing) setResizing(null);
    if (moving) setMoving(null);
  }

  // PDF
  function exportPDF() {
    const w = window.open("", "_blank"); if (!w) return;
    if (tab === "calendar") {
      // カレンダー月間表示PDF
      const [calY, calM] = historyMonth.split("-").map(Number);
      const daysInMonth = new Date(calY, calM, 0).getDate();
      const dayNames = ["日","月","火","水","木","金","土"];
      const allDates = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(calY, calM - 1, i + 1);
        return { day: i + 1, dow: d.getDay(), dateStr: d.toISOString().split("T")[0] };
      });
      let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>シフトカレンダー</title>
        <style>body{font-family:"Hiragino Sans",sans-serif;padding:12px;font-size:9px}
        h1{font-size:14px;margin-bottom:2px}p.sub{color:#888;font-size:9px;margin-bottom:10px}
        table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:2px 3px;text-align:center}
        th{background:#f5f5f5;font-size:8px}.name{text-align:left;font-weight:600;white-space:nowrap}
        .badge{background:#3a8f7c;color:#fff;border-radius:3px;padding:1px 3px;font-size:8px;display:inline-block}
        .sun{color:#c5221f}.sat{color:#3a8f7c}
        @media print{@page{size:landscape;margin:8mm}}</style></head>
        <body><h1>シフトカレンダー - ${calY}年${calM}月</h1><p class="sub">Come On Casino | てんぽみえるくん</p>
        <table><thead><tr><th class="name" style="min-width:60px">スタッフ</th>`;
      allDates.forEach(d => {
        const cls = d.dow === 0 ? ' class="sun"' : d.dow === 6 ? ' class="sat"' : '';
        html += `<th${cls}><div style="font-size:7px">${dayNames[d.dow]}</div><div>${d.day}</div></th>`;
      });
      html += `</tr></thead><tbody>`;
      STAFF_LIST.forEach(s => {
        html += `<tr><td class="name">${s.name}</td>`;
        allDates.forEach(d => {
          const shift = shifts.find(sh => sh.staffId === s.id && sh.date === d.dateStr);
          if (shift) {
            html += `<td><span class="badge">${qToTime(shift.startQ).replace(":00","")}-${qToTime(shift.endQ).replace(":00","")}</span></td>`;
          } else {
            html += `<td style="color:#ccc">—</td>`;
          }
        });
        html += `</tr>`;
      });
      html += `</tbody></table></body></html>`;
      w.document.write(html); w.document.close();
      setTimeout(() => w.print(), 500);
      return;
    }
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>シフト表</title>
      <style>body{font-family:"Hiragino Sans",sans-serif;padding:20px;font-size:11px}
      h1{font-size:15px;margin-bottom:2px}p.sub{color:#888;font-size:10px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px 6px}
      th{background:#f5f5f5;font-size:9px;text-transform:uppercase}
      .bar{background:#3a8f7c;color:#fff;border-radius:3px;padding:1px 4px;font-size:9px;display:inline-block}</style></head>
      <body><h1>シフト表 - ${dateLabelShort(selectedDate)}</h1><p class="sub">Come On Casino | てんぽみえるくん</p>
      <table><thead><tr><th style="width:80px">スタッフ</th><th>シフト</th></tr></thead><tbody>`;
    STAFF_LIST.forEach(s => {
      const bar = getBar(s.id, selectedDate);
      html += `<tr><td>${s.name}</td><td>${bar ? `<span class="bar">${qToTime(bar.startQ)} - ${qToTime(bar.endQ)}</span>` : "—"}</td></tr>`;
    });
    html += `</tbody></table></body></html>`;
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 500);
  }

  // 出勤簿PDF
  function exportAttendancePDF() {
    const w = window.open("", "_blank"); if (!w) return;
    const [y, m] = historyMonth.split("-");
    const daysInMonth = new Date(parseInt(y), parseInt(m), 0).getDate();
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>出勤簿</title>
      <style>body{font-family:"Hiragino Sans",sans-serif;padding:20px;font-size:10px}
      h1{font-size:15px;margin-bottom:2px}p.sub{color:#888;font-size:10px;margin-bottom:16px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:4px 6px;text-align:center}
      th{background:#f5f5f5;font-size:9px}.name{text-align:left;font-weight:600}
      .time{font-family:monospace;font-size:9px}.total{font-weight:700;background:#f9f9f9}</style></head>
      <body><h1>出勤簿 - ${y}年${parseInt(m)}月</h1>
      <p class="sub">Come On Casino | てんぽみえるくん | ※勤務時間は分単位（秒切り捨て）</p>`;
    STAFF_LIST.forEach(s => {
      html += `<h3 style="margin:16px 0 4px;font-size:12px">${s.name}（${s.role}）</h3>`;
      html += `<table><thead><tr><th>日付</th><th>出勤</th><th>退勤</th><th>休憩</th><th>勤務時間</th><th>備考</th></tr></thead><tbody>`;
      let totalMin = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dt = new Date(parseInt(y), parseInt(m)-1, d);
        const dayName = ["日","月","火","水","木","金","土"][dt.getDay()];
        const isWeekend = dt.getDay() === 0 || dt.getDay() === 6;
        // デモ: ランダムにシフトデータ生成
        const hasShift = d % 7 !== 0 && d % 3 !== 0; // 適当な休み
        const clockIn = hasShift ? "18:00" : "";
        const clockOut = hasShift ? "24:00" : "";
        const breakMin = hasShift ? 60 : 0;
        const workMin = hasShift ? 300 : 0; // 5h
        totalMin += workMin;
        html += `<tr${isWeekend?" style='background:#fafafa'":""}><td>${d}日(${dayName})</td>`;
        html += `<td class="time">${clockIn}</td><td class="time">${clockOut}</td>`;
        html += `<td>${breakMin > 0 ? breakMin+"分" : ""}</td>`;
        html += `<td class="time">${workMin > 0 ? Math.floor(workMin/60)+"h"+workMin%60+"m" : ""}</td>`;
        html += `<td></td></tr>`;
      }
      html += `<tr class="total"><td colspan="4">合計</td><td>${Math.floor(totalMin/60)}h${totalMin%60}m</td><td></td></tr>`;
      html += `</tbody></table>`;
    });
    html += `</body></html>`;
    w.document.write(html); w.document.close();
    setTimeout(() => w.print(), 500);
  }

  // 履歴デモデータ
  const historyData = STAFF_LIST.map(s => {
    const days: { date: string; clockIn: string; clockOut: string; breakMin: number; workMin: number }[] = [];
    for (let i = 1; i <= 10; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (i % 3 === 0) continue; // 休み
      days.push({ date: `${d.getMonth()+1}/${d.getDate()}`, clockIn: "18:00", clockOut: "24:00", breakMin: 60, workMin: 300 });
    }
    return { ...s, days };
  });

  const working = staff.filter(s => s.status === "working").length;
  const onBreak = staff.filter(s => s.status === "on_break").length;
  const finished = staff.filter(s => s.status === "finished").length;
  const notStarted = staff.filter(s => s.status === "off").length;
  const pending = staff.filter(s => s.needsApproval).length;

  // 時間ラベル (1時間ごと)
  const hourLabels = Array.from({ length: TL_END_H - TL_START_H + 1 }, (_, i) => TL_START_H + i);

  return (
    <div className="page-stack">
      {/* KPI */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-10 flex-wrap">
            <KpiItem label="出勤中" value={working} unit="名" accent />
            <KpiItem label="休憩中" value={onBreak} unit="名" />
            <KpiItem label="退勤済" value={finished} unit="名" />
            <KpiItem label="未出勤" value={notStarted} unit="名" />
            {pending > 0 && <KpiItem label="承認待ち" value={pending} unit="件" danger />}
          </div>
          {(tab === "shift" || tab === "create" || tab === "calendar") && (
            <button onClick={exportPDF} className="btn btn-secondary">
              <FileDown className="w-3.5 h-3.5" />PDF出力
            </button>
          )}
        </div>
      </section>

      {/* タブ */}
      <section>
        <div className="tabs">
          <button onClick={() => setTab("today")} className={`tab ${tab === "today" ? "tab-active" : ""}`}>
            <Clock className="w-3 h-3 inline mr-1" />本日の勤怠
          </button>
          <button onClick={() => setTab("shift")} className={`tab ${tab === "shift" ? "tab-active" : ""}`}>
            <Calendar className="w-3 h-3 inline mr-1" />シフト確認
          </button>
          <button onClick={() => setTab("create")} className={`tab ${tab === "create" ? "tab-active" : ""}`}>
            <Plus className="w-3 h-3 inline mr-1" />シフト作成
          </button>
          <button onClick={() => setTab("calendar")} className={`tab ${tab === "calendar" ? "tab-active" : ""}`}>
            <Calendar className="w-3 h-3 inline mr-1" />カレンダー
          </button>
          <button onClick={() => setTab("history")} className={`tab ${tab === "history" ? "tab-active" : ""}`}>
            <FileDown className="w-3 h-3 inline mr-1" />履歴・出勤簿
          </button>
        </div>
      </section>

      {/* ===== 本日の勤怠 ===== */}
      {tab === "today" && (
        <>
          <div className="glass-panel">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-border-light">
                {["スタッフ","役割","出勤","退勤","休憩","勤務","状態","操作"].map(h => (
                  <th key={h} className="px-4 py-2.5 data-th">{h}</th>
                ))}
              </tr></thead>
              <tbody>{staff.map(s => (
                <tr key={s.id} className={`border-b border-border-light ${s.needsApproval ? "bg-[#fef7e0]/30" : ""}`}>
                  <td className="px-4 py-2.5">
                    <Link href={`/g8n4vr/${s.id}`} className="font-medium text-text-primary hover:text-accent transition-colors">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-text-secondary text-[12px]">{s.role}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{s.clockIn ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{s.clockOut ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[12px]">{s.breakMin > 0 ? `${s.breakMin}分` : "—"}</td>
                  <td className="px-4 py-2.5 text-[12px] font-medium">{s.workMin != null ? `${Math.floor(s.workMin/60)}h${s.workMin%60}m` : "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`chip chip-sm ${
                      s.status==="working"?"chip-success":s.status==="on_break"?"chip-warning":s.status==="finished"?"chip-accent":"chip-neutral"
                    }`}>{s.status==="working"?"勤務中":s.status==="on_break"?"休憩中":s.status==="finished"?"退勤済":"未出勤"}</span>
                  </td>
                  <td className="px-4 py-2.5 space-x-1">
                    {s.needsApproval && <button onClick={()=>approve(s.id)} className="px-2 py-0.5 text-[11px] text-status-success bg-[#e6f4ea] rounded-[4px] hover:bg-green-200"><Check className="w-3 h-3 inline"/> 承認</button>}
                    {s.status !== "off" && <button onClick={()=>{setEditId(s.id);setEditTime(s.clockOut??"");}} className="px-2 py-0.5 text-[11px] text-text-secondary hover:bg-bg-hover rounded-[4px]">修正</button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {editId && (
            <div className="pt-4 border-t border-border-light space-y-3">
              <h3 className="text-[13px] font-semibold">勤怠修正: {staff.find(s=>s.id===editId)?.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">退勤時刻</label><input type="time" value={editTime} onChange={e=>setEditTime(e.target.value)} className="mt-1"/></div>
                <div><label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">修正理由 *</label><input type="text" value={editReason} onChange={e=>setEditReason(e.target.value)} className="mt-1" placeholder="打刻忘れ修正など"/></div>
              </div>
              <div className="flex gap-2">
                <button onClick={submitModify} disabled={!editReason} className="px-4 py-[7px] bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover disabled:opacity-50">修正を申請</button>
                <button onClick={()=>setEditId(null)} className="px-4 py-[7px] border border-border text-[13px] rounded-[6px] hover:bg-bg-hover">キャンセル</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== シフト確認 / シフト作成 共通タイムライン ===== */}
      {(tab === "shift" || tab === "create") && (
        <div className="overflow-hidden select-none"
          onMouseMove={tab === "create" ? handleTimelineMouseMove : undefined}
          onMouseUp={tab === "create" ? handleTimelineMouseUp : undefined}
          onMouseLeave={tab === "create" ? handleTimelineMouseUp : undefined}>

          {/* 日付切替ヘッダー */}
          <div className="flex items-center border-b border-border-light px-2 py-2 gap-1 overflow-x-auto">
            <button onClick={() => changeDate(-1)} className="p-1 hover:bg-bg-hover rounded-[4px] flex-shrink-0"><ChevronLeft className="w-4 h-4" /></button>
            {dates.map(d => (
              <button key={d} onClick={() => setSelectedDate(d)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-[6px] flex-shrink-0 transition-colors ${
                  selectedDate === d ? "bg-accent text-white" : "text-text-secondary hover:bg-bg-hover"
                }`}>
                {dateLabelShort(d)}
              </button>
            ))}
            <button onClick={() => changeDate(1)} className="p-1 hover:bg-bg-hover rounded-[4px] flex-shrink-0"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {/* 時間ヘッダー（15分グリッド） */}
          <div className="flex border-b border-border-light">
            <div className="w-28 flex-shrink-0 px-3 py-2 text-[11px] font-semibold text-text-tertiary uppercase">スタッフ</div>
            <div className="flex-1 flex" ref={timelineRef}>
              {hourLabels.map((h, i) => (
                <div key={h} className="flex-1 text-center py-2 text-[10px] font-semibold text-text-tertiary border-l border-border-light relative">
                  {h}
                  {/* 15分刻みの薄いライン */}
                  {i < hourLabels.length - 1 && [1,2,3].map(q => (
                    <div key={q} className="absolute top-0 bottom-0 border-l border-border-light" style={{ left: `${q * 25}%` }} />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* スタッフ行 */}
          {STAFF_LIST.map(s => {
            const bar = getBar(s.id, selectedDate);
            const dragBar = dragging?.staffId === s.id ? dragging : null;
            return (
              <div key={s.id} className="flex border-b border-border-light hover:bg-[#fafafa] transition-colors">
                <div className="w-28 flex-shrink-0 px-3 py-3 text-[12px] font-medium flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                  <Link href={`/g8n4vr/${s.id}`} className="hover:text-accent transition-colors">
                    {s.name.split(" ")[0]}
                  </Link>
                </div>
                <div className="flex-1 relative h-12 cursor-crosshair"
                  onMouseDown={tab === "create" ? (e) => handleTimelineMouseDown(s.id, e) : undefined}>

                  {/* 時間グリッド線 */}
                  {hourLabels.map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-border-light" style={{ left: `${(i / (hourLabels.length - 1)) * 100}%` }} />
                  ))}

                  {/* 既存バー */}
                  {bar && (() => {
                    const barLeft = (bar.startQ / TOTAL_Q) * 100;
                    const barWidth = ((bar.endQ - bar.startQ) / TOTAL_Q) * 100;
                    const totalBreakMin = bar.breaks.reduce((sum, b) => sum + (b.endQ - b.startQ) * 15, 0);
                    return (
                      <div className="absolute top-2 bottom-2 rounded-[4px] bg-accent group cursor-grab overflow-hidden active:cursor-grabbing"
                        style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                        onClick={e => e.stopPropagation()}
                        onMouseDown={tab === "create" ? (e) => {
                          if (breakMode) {
                            e.stopPropagation();
                            const q = getQFromMouse(e);
                            setBreakDragging({ staffId: s.id, startQ: q, currentQ: q });
                          } else {
                            e.stopPropagation();
                            const q = getQFromMouse(e);
                            setMoving({ staffId: s.id, date: selectedDate, startMouseQ: q, origStartQ: bar.startQ, origEndQ: bar.endQ });
                          }
                        } : undefined}
                        onDoubleClick={tab === "create" ? (e) => {
                          e.stopPropagation();
                          setBreakMode(prev => !prev);
                        } : undefined}>

                        {/* 休憩帯（オレンジ） */}
                        {bar.breaks.map((brk, bi) => {
                          const relLeft = ((brk.startQ - bar.startQ) / (bar.endQ - bar.startQ)) * 100;
                          const relWidth = ((brk.endQ - brk.startQ) / (bar.endQ - bar.startQ)) * 100;
                          return (
                            <div key={bi} className="absolute top-0 bottom-0 bg-[#e37400] group/brk"
                              style={{ left: `${relLeft}%`, width: `${relWidth}%` }}>
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white/90 font-medium">休</span>
                              {tab === "create" && (
                                <button onClick={e => { e.stopPropagation(); setShifts(prev => prev.map(x => x.staffId === s.id && x.date === selectedDate ? { ...x, breaks: x.breaks.filter((_, j) => j !== bi) } : x)); }}
                                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-status-danger text-white rounded-full text-[7px] flex items-center justify-center opacity-0 group-hover/brk:opacity-100 transition-opacity z-10">✕</button>
                              )}
                            </div>
                          );
                        })}

                        {/* ラベル */}
                        <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium whitespace-nowrap pointer-events-none">
                          {qToTime(bar.startQ)}–{qToTime(bar.endQ)}{totalBreakMin > 0 ? ` (休${totalBreakMin}分)` : ""}
                        </span>

                        {/* 休憩ドラッグ中プレビュー */}
                        {breakDragging?.staffId === s.id && (() => {
                          const bs = Math.max(bar.startQ, Math.min(breakDragging.startQ, breakDragging.currentQ));
                          const be = Math.min(bar.endQ, Math.max(breakDragging.startQ, breakDragging.currentQ));
                          if (be - bs < 1) return null;
                          const relL = ((bs - bar.startQ) / (bar.endQ - bar.startQ)) * 100;
                          const relW = ((be - bs) / (bar.endQ - bar.startQ)) * 100;
                          return <div className="absolute top-0 bottom-0 bg-[#e37400]/50 border-2 border-[#e37400] border-dashed rounded-[2px]" style={{ left: `${relL}%`, width: `${relW}%` }} />;
                        })()}

                        {/* リサイズハンドル */}
                        {tab === "create" && (
                          <>
                            <div className="w-2 h-full cursor-ew-resize absolute left-0 top-0 rounded-l-[4px] hover:bg-accent-hover z-10"
                              onMouseDown={e => { e.stopPropagation(); setResizing({ staffId: s.id, edge: "start", origBar: bar }); }} />
                            <div className="w-2 h-full cursor-ew-resize absolute right-0 top-0 rounded-r-[4px] hover:bg-accent-hover z-10"
                              onMouseDown={e => { e.stopPropagation(); setResizing({ staffId: s.id, edge: "end", origBar: bar }); }} />
                          </>
                        )}
                        {/* 削除ボタン */}
                        {tab === "create" && (
                          <button onClick={e => { e.stopPropagation(); deleteBar(s.id, selectedDate); }}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-status-danger text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">✕</button>
                        )}
                      </div>
                    );
                  })()}

                  {/* ドラッグ中のプレビュー */}
                  {dragBar && (
                    <div className="absolute top-2 bottom-2 rounded-[4px] bg-accent/40 border-2 border-accent border-dashed"
                      style={{
                        left: `${(Math.min(dragBar.startQ, dragBar.currentQ) / TOTAL_Q) * 100}%`,
                        width: `${(Math.abs(dragBar.currentQ - dragBar.startQ) / TOTAL_Q) * 100}%`,
                      }}>
                      <span className="text-[9px] text-accent font-medium px-1">
                        {qToTime(Math.min(dragBar.startQ, dragBar.currentQ))}–{qToTime(Math.max(dragBar.startQ, dragBar.currentQ))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* フッター */}
          {tab === "create" && (
            <div className="px-4 py-2.5 bg-bg-hover border-t border-border-light flex items-center gap-3 text-[11px] text-text-tertiary">
              <Image src="/logo-icon.png" alt="" width={16} height={16} className="opacity-30" />
              <span>空白ドラッグ→シフト作成 | バードラッグ→移動 | 端ドラッグ→リサイズ | <strong className={breakMode ? "text-[#e37400]" : "text-text-tertiary"}>バーをダブルクリック→休憩モード{breakMode ? " ON ✓" : ""}</strong> | 15分単位</span>
              {breakMode && <span className="ml-2 px-2 py-0.5 bg-[#e37400] text-white text-[10px] rounded-[4px] font-medium">休憩モード: バー内をドラッグして休憩を設定</span>}
            </div>
          )}
        </div>
      )}

      {/* ===== カレンダー（横:日付, 縦:スタッフ） ===== */}
      {tab === "calendar" && (() => {
        const [calY, calM] = historyMonth.split("-").map(Number);
        const daysInMonth = new Date(calY, calM, 0).getDate();
        const dayNames = ["日","月","火","水","木","金","土"];
        const allDates = Array.from({ length: daysInMonth }, (_, i) => {
          const d = new Date(calY, calM - 1, i + 1);
          return { day: i + 1, dow: d.getDay(), dateStr: d.toISOString().split("T")[0] };
        });
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button onClick={() => { const d = new Date(calY, calM - 2, 1); setHistoryMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); }} className="p-1 hover:bg-bg-hover rounded-[4px]"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-[14px] font-semibold">{calY}年{calM}月</span>
              <button onClick={() => { const d = new Date(calY, calM, 1); setHistoryMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); }} className="p-1 hover:bg-bg-hover rounded-[4px]"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="px-3 py-2 text-[10px] font-semibold text-text-tertiary uppercase text-left sticky left-0 bg-[#faf9f7] z-10 min-w-[80px]">スタッフ</th>
                    {allDates.map(d => (
                      <th key={d.day} className={`px-1 py-2 text-center min-w-[36px] ${d.dow === 0 ? "text-status-danger" : d.dow === 6 ? "text-accent" : "text-text-tertiary"}`}>
                        <div className="text-[9px]">{dayNames[d.dow]}</div>
                        <div className="text-[11px] font-semibold">{d.day}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STAFF_LIST.map(staff => (
                    <tr key={staff.id} className="border-b border-border-light">
                      <td className="px-3 py-2 font-medium text-[12px] sticky left-0 bg-white z-10">
                        <Link href={`/g8n4vr/${staff.id}`} className="hover:text-accent transition-colors">
                          {staff.name}
                        </Link>
                      </td>
                      {allDates.map(d => {
                        const shift = shifts.find(s => s.staffId === staff.id && s.date === d.dateStr);
                        return (
                          <td key={d.day} className={`px-0.5 py-1 text-center ${d.dow === 0 || d.dow === 6 ? "bg-[#fafafa]" : ""}`}>
                            {shift ? (
                              <div className="flex flex-col items-center">
                                <span className="inline-block px-1.5 py-0.5 bg-accent text-white text-[9px] font-medium rounded-[3px] leading-tight">
                                  {qToTime(shift.startQ).replace(":00","")}-{qToTime(shift.endQ).replace(":00","")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[#d8d3cc]">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-text-tertiary">※「シフト作成」タブで設定したシフトが反映されます</p>
          </div>
        );
      })()}

      {/* ===== 履歴・出勤簿 ===== */}
      {tab === "history" && (
        <div className="page-stack">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="text-[12px] text-text-secondary">対象月:</label>
              <input type="month" value={historyMonth} onChange={e => setHistoryMonth(e.target.value)} className="text-[13px] py-1 px-2 border border-border rounded-[6px]" />
            </div>
            <button onClick={exportAttendancePDF} className="btn btn-primary">
              <FileDown className="w-3.5 h-3.5" />出勤簿PDF出力
            </button>
          </div>
          <p className="text-[11px] text-text-tertiary">※勤務時間は分単位（秒切り捨て）で計算</p>

          {/* スタッフ別履歴 */}
          {historyData.map(s => (
            <div key={s.id} className="overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border-light flex items-center justify-between">
                <Link href={`/g8n4vr/${s.id}`} className="text-[13px] font-semibold hover:text-accent transition-colors">
                  {s.name}
                </Link>
                <span className="text-[11px] text-text-tertiary">{s.role} | 合計 {s.days.reduce((sum, d) => sum + d.workMin, 0)}分 ({Math.floor(s.days.reduce((sum, d) => sum + d.workMin, 0) / 60)}h{s.days.reduce((sum, d) => sum + d.workMin, 0) % 60}m)</span>
              </div>
              <table className="w-full text-[12px]">
                <thead><tr className="border-b border-border-light">
                  <th className="px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase text-left">日付</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase text-left">出勤</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase text-left">退勤</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase text-left">休憩</th>
                  <th className="px-4 py-2 text-[10px] font-semibold text-text-tertiary uppercase text-left">勤務時間</th>
                </tr></thead>
                <tbody>{s.days.map((d, i) => (
                  <tr key={i} className="border-b border-border-light">
                    <td className="px-4 py-1.5">{d.date}</td>
                    <td className="px-4 py-1.5 font-mono">{d.clockIn}</td>
                    <td className="px-4 py-1.5 font-mono">{d.clockOut}</td>
                    <td className="px-4 py-1.5">{d.breakMin}分</td>
                    <td className="px-4 py-1.5 font-medium">{Math.floor(d.workMin/60)}h{d.workMin%60}m</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KpiItem({ label, value, unit, accent, danger }: { label: string; value: string | number; unit?: string; accent?: boolean; danger?: boolean }) {
  const color = danger ? "var(--danger-text)" : accent ? "var(--primary-text)" : "var(--text-primary)";
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value" style={{ color }}>{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
    </div>
  );
}
