"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Clock, Check, AlertCircle, Calendar, ChevronLeft, ChevronRight, Plus, FileDown } from "lucide-react";

// ===== 型 =====
interface StaffRecord {
  id: string; name: string; role: string;
  clockIn: string | null; clockOut: string | null;
  breakMin: number; workMin: number | null;
  status: "working" | "on_break" | "finished" | "off";
  needsApproval: boolean;
}
interface ShiftBar {
  staffId: string; date: string; startQ: number; endQ: number; // 15分単位 (0=14:00, 1=14:15 ...)
}

// ===== 定数 =====
const STAFF_LIST = [
  { id: "s1", name: "山田 太郎", role: "ディーラー" },
  { id: "s2", name: "鈴木 一郎", role: "ディーラー" },
  { id: "s3", name: "佐藤 花", role: "フロア" },
  { id: "s4", name: "高橋 健", role: "ディーラー" },
  { id: "s5", name: "伊藤 美咲", role: "フロア" },
];

const ATTENDANCE: StaffRecord[] = [
  { id: "s1", name: "山田 太郎", role: "ディーラー", clockIn: "18:00", clockOut: null, breakMin: 0, workMin: null, status: "working", needsApproval: false },
  { id: "s2", name: "鈴木 一郎", role: "ディーラー", clockIn: "18:00", clockOut: null, breakMin: 30, workMin: null, status: "on_break", needsApproval: false },
  { id: "s3", name: "佐藤 花", role: "フロア", clockIn: "17:30", clockOut: "23:30", breakMin: 60, workMin: 300, status: "finished", needsApproval: false },
  { id: "s4", name: "高橋 健", role: "ディーラー", clockIn: "18:15", clockOut: "23:00", breakMin: 30, workMin: 255, status: "finished", needsApproval: true },
  { id: "s5", name: "伊藤 美咲", role: "フロア", clockIn: null, clockOut: null, breakMin: 0, workMin: null, status: "off", needsApproval: false },
];

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

// 初期シフト
function makeInitShifts(): ShiftBar[] {
  const bars: ShiftBar[] = [];
  const today = dateStr(0);
  // s1: 18:00-24:00 = Q16-Q40
  bars.push({ staffId: "s1", date: today, startQ: 16, endQ: 40 });
  bars.push({ staffId: "s2", date: today, startQ: 16, endQ: 40 });
  bars.push({ staffId: "s3", date: today, startQ: 12, endQ: 36 }); // 17:00-23:00
  bars.push({ staffId: "s4", date: today, startQ: 17, endQ: 40 }); // 18:15-24:00
  // 明日のシフト
  const tmrw = dateStr(1);
  bars.push({ staffId: "s1", date: tmrw, startQ: 16, endQ: 40 });
  bars.push({ staffId: "s3", date: tmrw, startQ: 12, endQ: 36 });
  bars.push({ staffId: "s5", date: tmrw, startQ: 12, endQ: 36 });
  return bars;
}

export default function AttendancePage() {
  const [staff, setStaff] = useState(ATTENDANCE);
  const [tab, setTab] = useState<"today" | "shift" | "create">("today");
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
    const newOff = dateOffset + dir;
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
        setShifts(prev => [...prev, { staffId: dragging.staffId, date: selectedDate, startQ: s, endQ: e }]);
      }
      setDragging(null);
    }
    if (resizing) setResizing(null);
  }

  // PDF
  function exportPDF() {
    const w = window.open("", "_blank"); if (!w) return;
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>シフト表</title>
      <style>body{font-family:"Hiragino Sans",sans-serif;padding:20px;font-size:11px}
      h1{font-size:15px;margin-bottom:2px}p.sub{color:#888;font-size:10px;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:5px 6px}
      th{background:#f5f5f5;font-size:9px;text-transform:uppercase}
      .bar{background:#1a73e8;color:#fff;border-radius:3px;padding:1px 4px;font-size:9px;display:inline-block}</style></head>
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

  const working = staff.filter(s => s.status === "working").length;
  const onBreak = staff.filter(s => s.status === "on_break").length;
  const pending = staff.filter(s => s.needsApproval).length;

  // 時間ラベル (1時間ごと)
  const hourLabels = Array.from({ length: TL_END_H - TL_START_H + 1 }, (_, i) => TL_START_H + i);

  return (
    <div className="space-y-4">
      {/* タブ */}
      <div className="flex items-center gap-1">
        <button onClick={() => setTab("today")} className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] ${tab === "today" ? "bg-[#1a73e8] text-white" : "text-[#5f6368] hover:bg-[#f0f1f3]"}`}>
          <Clock className="w-3 h-3 inline mr-1" />本日の勤怠
        </button>
        <button onClick={() => setTab("shift")} className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] ${tab === "shift" ? "bg-[#1a73e8] text-white" : "text-[#5f6368] hover:bg-[#f0f1f3]"}`}>
          <Calendar className="w-3 h-3 inline mr-1" />シフト確認
        </button>
        <button onClick={() => setTab("create")} className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] ${tab === "create" ? "bg-[#1a73e8] text-white" : "text-[#5f6368] hover:bg-[#f0f1f3]"}`}>
          <Plus className="w-3 h-3 inline mr-1" />シフト作成
        </button>
        {tab === "today" && (
          <div className="ml-auto flex items-center gap-3 text-[12px]">
            <span className="text-[#5f6368]">出勤 <strong className="text-[#188038]">{working}</strong></span>
            <span className="text-[#5f6368]">休憩 <strong className="text-[#e37400]">{onBreak}</strong></span>
            {pending > 0 && <span className="flex items-center gap-1 text-[#d93025]"><AlertCircle className="w-3 h-3" />承認待ち {pending}</span>}
          </div>
        )}
        {(tab === "shift" || tab === "create") && (
          <button onClick={exportPDF} className="ml-auto flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-[#5f6368] hover:bg-[#f0f1f3] rounded-[6px]">
            <FileDown className="w-3.5 h-3.5" />PDF出力
          </button>
        )}
      </div>

      {/* ===== 本日の勤怠 ===== */}
      {tab === "today" && (
        <>
          <div className="bg-white border border-[#dadce0] rounded-[8px] overflow-hidden">
            <table className="w-full text-[13px]">
              <thead><tr className="border-b border-[#dadce0] bg-[#f5f6f8]">
                {["スタッフ","役割","出勤","退勤","休憩","勤務","状態","操作"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold text-[#9aa0a6] uppercase tracking-wider text-left">{h}</th>
                ))}
              </tr></thead>
              <tbody>{staff.map(s => (
                <tr key={s.id} className={`border-b border-[#e8eaed] ${s.needsApproval ? "bg-[#fef7e0]/30" : ""}`}>
                  <td className="px-4 py-2.5 font-medium">{s.name}</td>
                  <td className="px-4 py-2.5 text-[#5f6368] text-[12px]">{s.role}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{s.clockIn ?? "—"}</td>
                  <td className="px-4 py-2.5 font-mono text-[12px]">{s.clockOut ?? "—"}</td>
                  <td className="px-4 py-2.5 text-[12px]">{s.breakMin > 0 ? `${s.breakMin}分` : "—"}</td>
                  <td className="px-4 py-2.5 text-[12px] font-medium">{s.workMin != null ? `${Math.floor(s.workMin/60)}h${s.workMin%60}m` : "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-[4px] ${
                      s.status==="working"?"bg-[#e6f4ea] text-[#188038]":s.status==="on_break"?"bg-[#fef7e0] text-[#e37400]":s.status==="finished"?"bg-[#e8f0fe] text-[#1a73e8]":"bg-[#f5f6f8] text-[#9aa0a6]"
                    }`}>{s.status==="working"?"勤務中":s.status==="on_break"?"休憩中":s.status==="finished"?"退勤済":"未出勤"}</span>
                  </td>
                  <td className="px-4 py-2.5 space-x-1">
                    {s.needsApproval && <button onClick={()=>approve(s.id)} className="px-2 py-0.5 text-[11px] text-[#188038] bg-[#e6f4ea] rounded-[4px] hover:bg-green-200"><Check className="w-3 h-3 inline"/> 承認</button>}
                    {s.status !== "off" && <button onClick={()=>{setEditId(s.id);setEditTime(s.clockOut??"");}} className="px-2 py-0.5 text-[11px] text-[#5f6368] hover:bg-[#f0f1f3] rounded-[4px]">修正</button>}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {editId && (
            <div className="bg-white border border-[#1a73e8]/30 rounded-[8px] p-4 space-y-3">
              <h3 className="text-[13px] font-semibold">勤怠修正: {staff.find(s=>s.id===editId)?.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[11px] text-[#9aa0a6] font-semibold uppercase tracking-wider">退勤時刻</label><input type="time" value={editTime} onChange={e=>setEditTime(e.target.value)} className="mt-1"/></div>
                <div><label className="text-[11px] text-[#9aa0a6] font-semibold uppercase tracking-wider">修正理由 *</label><input type="text" value={editReason} onChange={e=>setEditReason(e.target.value)} className="mt-1" placeholder="打刻忘れ修正など"/></div>
              </div>
              <div className="flex gap-2">
                <button onClick={submitModify} disabled={!editReason} className="px-4 py-[7px] bg-[#1a73e8] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#1557b0] disabled:opacity-50">修正を申請</button>
                <button onClick={()=>setEditId(null)} className="px-4 py-[7px] border border-[#dadce0] text-[13px] rounded-[6px] hover:bg-[#f0f1f3]">キャンセル</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== シフト確認 / シフト作成 共通タイムライン ===== */}
      {(tab === "shift" || tab === "create") && (
        <div className="bg-white border border-[#dadce0] rounded-[8px] overflow-hidden select-none"
          onMouseMove={tab === "create" ? handleTimelineMouseMove : undefined}
          onMouseUp={tab === "create" ? handleTimelineMouseUp : undefined}
          onMouseLeave={tab === "create" ? handleTimelineMouseUp : undefined}>

          {/* 日付切替ヘッダー */}
          <div className="flex items-center border-b border-[#e8eaed] px-2 py-2 gap-1 overflow-x-auto">
            <button onClick={() => changeDate(-1)} className="p-1 hover:bg-[#f0f1f3] rounded-[4px] flex-shrink-0"><ChevronLeft className="w-4 h-4" /></button>
            {dates.map(d => (
              <button key={d} onClick={() => setSelectedDate(d)}
                className={`px-3 py-1.5 text-[11px] font-medium rounded-[6px] flex-shrink-0 transition-colors ${
                  selectedDate === d ? "bg-[#1a73e8] text-white" : "text-[#5f6368] hover:bg-[#f0f1f3]"
                }`}>
                {dateLabelShort(d)}
              </button>
            ))}
            <button onClick={() => changeDate(1)} className="p-1 hover:bg-[#f0f1f3] rounded-[4px] flex-shrink-0"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {/* 時間ヘッダー（15分グリッド） */}
          <div className="flex border-b border-[#e8eaed]">
            <div className="w-28 flex-shrink-0 px-3 py-2 text-[11px] font-semibold text-[#9aa0a6] uppercase">スタッフ</div>
            <div className="flex-1 flex" ref={timelineRef}>
              {hourLabels.map((h, i) => (
                <div key={h} className="flex-1 text-center py-2 text-[10px] font-semibold text-[#9aa0a6] border-l border-[#e8eaed] relative">
                  {h}
                  {/* 15分刻みの薄いライン */}
                  {i < hourLabels.length - 1 && [1,2,3].map(q => (
                    <div key={q} className="absolute top-0 bottom-0 border-l border-[#f0f1f3]" style={{ left: `${q * 25}%` }} />
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
              <div key={s.id} className="flex border-b border-[#e8eaed] hover:bg-[#fafafa] transition-colors">
                <div className="w-28 flex-shrink-0 px-3 py-3 text-[12px] font-medium flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
                  {s.name.split(" ")[0]}
                </div>
                <div className="flex-1 relative h-12 cursor-crosshair"
                  onMouseDown={tab === "create" ? (e) => handleTimelineMouseDown(s.id, e) : undefined}>

                  {/* 時間グリッド線 */}
                  {hourLabels.map((_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-[#e8eaed]" style={{ left: `${(i / (hourLabels.length - 1)) * 100}%` }} />
                  ))}

                  {/* 既存バー */}
                  {bar && (
                    <div className="absolute top-2 bottom-2 rounded-[4px] bg-[#1a73e8] flex items-center justify-between px-1.5 group cursor-default"
                      style={{ left: `${(bar.startQ / TOTAL_Q) * 100}%`, width: `${((bar.endQ - bar.startQ) / TOTAL_Q) * 100}%` }}
                      onClick={e => e.stopPropagation()}>
                      {/* 左リサイズハンドル */}
                      {tab === "create" && (
                        <div className="w-2 h-full cursor-ew-resize absolute left-0 top-0 rounded-l-[4px] hover:bg-[#1557b0]"
                          onMouseDown={e => { e.stopPropagation(); setResizing({ staffId: s.id, edge: "start", origBar: bar }); }} />
                      )}
                      <span className="text-[10px] text-white font-medium whitespace-nowrap mx-auto">
                        {qToTime(bar.startQ)}–{qToTime(bar.endQ)}
                      </span>
                      {/* 右リサイズハンドル */}
                      {tab === "create" && (
                        <div className="w-2 h-full cursor-ew-resize absolute right-0 top-0 rounded-r-[4px] hover:bg-[#1557b0]"
                          onMouseDown={e => { e.stopPropagation(); setResizing({ staffId: s.id, edge: "end", origBar: bar }); }} />
                      )}
                      {/* 削除ボタン */}
                      {tab === "create" && (
                        <button onClick={e => { e.stopPropagation(); deleteBar(s.id, selectedDate); }}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-[#c5221f] text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                      )}
                    </div>
                  )}

                  {/* ドラッグ中のプレビュー */}
                  {dragBar && (
                    <div className="absolute top-2 bottom-2 rounded-[4px] bg-[#1a73e8]/40 border-2 border-[#1a73e8] border-dashed"
                      style={{
                        left: `${(Math.min(dragBar.startQ, dragBar.currentQ) / TOTAL_Q) * 100}%`,
                        width: `${(Math.abs(dragBar.currentQ - dragBar.startQ) / TOTAL_Q) * 100}%`,
                      }}>
                      <span className="text-[9px] text-[#1a73e8] font-medium px-1">
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
            <div className="px-4 py-2.5 bg-[#f5f6f8] border-t border-[#e8eaed] flex items-center gap-3 text-[11px] text-[#9aa0a6]">
              <Image src="/logo-icon.png" alt="" width={16} height={16} className="opacity-30" />
              <span>空白エリアをドラッグしてシフトを作成 | バーの端をドラッグしてリサイズ | 15分単位</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
