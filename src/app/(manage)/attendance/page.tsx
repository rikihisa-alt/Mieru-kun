"use client";

import { useState, useRef } from "react";
import { Clock, Check, AlertCircle, Calendar, ChevronLeft, ChevronRight, Plus, FileDown, X, Pencil } from "lucide-react";

interface StaffRecord {
  id: string; name: string; role: string;
  clockIn: string | null; clockOut: string | null;
  breakMin: number; workMin: number | null;
  status: "working" | "on_break" | "finished" | "off";
  needsApproval: boolean;
}

interface ShiftEntry {
  staffId: string; staffName: string; day: number; start: string; end: string;
}

const STAFF_NAMES = [
  { id: "s1", name: "山田 太郎", role: "ディーラー" },
  { id: "s2", name: "鈴木 一郎", role: "ディーラー" },
  { id: "s3", name: "佐藤 花", role: "フロア" },
  { id: "s4", name: "高橋 健", role: "ディーラー" },
  { id: "s5", name: "伊藤 美咲", role: "フロア" },
];

const STAFF: StaffRecord[] = [
  { id: "s1", name: "山田 太郎", role: "ディーラー", clockIn: "18:00", clockOut: null, breakMin: 0, workMin: null, status: "working", needsApproval: false },
  { id: "s2", name: "鈴木 一郎", role: "ディーラー", clockIn: "18:00", clockOut: null, breakMin: 30, workMin: null, status: "on_break", needsApproval: false },
  { id: "s3", name: "佐藤 花", role: "フロア", clockIn: "17:30", clockOut: "23:30", breakMin: 60, workMin: 300, status: "finished", needsApproval: false },
  { id: "s4", name: "高橋 健", role: "ディーラー", clockIn: "18:15", clockOut: "23:00", breakMin: 30, workMin: 255, status: "finished", needsApproval: true },
  { id: "s5", name: "伊藤 美咲", role: "フロア", clockIn: null, clockOut: null, breakMin: 0, workMin: null, status: "off", needsApproval: false },
];

const DAYS = ["月", "火", "水", "木", "金", "土", "日"];

// 初期シフトデータ
const INIT_SHIFTS: ShiftEntry[] = [
  { staffId: "s1", staffName: "山田 太郎", day: 1, start: "18", end: "24" },
  { staffId: "s1", staffName: "山田 太郎", day: 2, start: "18", end: "24" },
  { staffId: "s1", staffName: "山田 太郎", day: 4, start: "18", end: "24" },
  { staffId: "s1", staffName: "山田 太郎", day: 5, start: "18", end: "24" },
  { staffId: "s1", staffName: "山田 太郎", day: 6, start: "18", end: "24" },
  { staffId: "s2", staffName: "鈴木 一郎", day: 0, start: "18", end: "24" },
  { staffId: "s2", staffName: "鈴木 一郎", day: 1, start: "18", end: "24" },
  { staffId: "s2", staffName: "鈴木 一郎", day: 3, start: "18", end: "24" },
  { staffId: "s2", staffName: "鈴木 一郎", day: 4, start: "18", end: "24" },
  { staffId: "s2", staffName: "鈴木 一郎", day: 6, start: "18", end: "24" },
  { staffId: "s3", staffName: "佐藤 花", day: 0, start: "17", end: "23" },
  { staffId: "s3", staffName: "佐藤 花", day: 2, start: "17", end: "23" },
  { staffId: "s3", staffName: "佐藤 花", day: 3, start: "17", end: "23" },
  { staffId: "s3", staffName: "佐藤 花", day: 5, start: "17", end: "23" },
  { staffId: "s3", staffName: "佐藤 花", day: 6, start: "17", end: "23" },
  { staffId: "s4", staffName: "高橋 健", day: 0, start: "18", end: "24" },
  { staffId: "s4", staffName: "高橋 健", day: 1, start: "18", end: "24" },
  { staffId: "s4", staffName: "高橋 健", day: 2, start: "18", end: "24" },
  { staffId: "s4", staffName: "高橋 健", day: 5, start: "18", end: "24" },
  { staffId: "s4", staffName: "高橋 健", day: 6, start: "18", end: "24" },
  { staffId: "s5", staffName: "伊藤 美咲", day: 1, start: "17", end: "23" },
  { staffId: "s5", staffName: "伊藤 美咲", day: 2, start: "17", end: "23" },
  { staffId: "s5", staffName: "伊藤 美咲", day: 3, start: "17", end: "23" },
  { staffId: "s5", staffName: "伊藤 美咲", day: 4, start: "17", end: "23" },
];

export default function AttendancePage() {
  const [staff, setStaff] = useState(STAFF);
  const [tab, setTab] = useState<"today" | "shift" | "create">("today");
  const [editId, setEditId] = useState<string | null>(null);
  const [editTime, setEditTime] = useState("");
  const [editReason, setEditReason] = useState("");
  const [shifts, setShifts] = useState<ShiftEntry[]>(INIT_SHIFTS);
  const [editingShift, setEditingShift] = useState<{ staffId: string; day: number } | null>(null);
  const [shiftStart, setShiftStart] = useState("18");
  const [shiftEnd, setShiftEnd] = useState("24");
  const shiftRef = useRef<HTMLDivElement>(null);

  function approve(id: string) {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, needsApproval: false } : s));
  }
  function submitModify() {
    if (!editId || !editReason) return;
    setStaff(prev => prev.map(s => s.id === editId ? { ...s, clockOut: editTime || s.clockOut, needsApproval: true } : s));
    setEditId(null); setEditTime(""); setEditReason("");
  }

  // シフトCRUD
  function addShift(staffId: string, day: number, start: string, end: string) {
    const sn = STAFF_NAMES.find(s => s.id === staffId)?.name ?? "";
    setShifts(prev => [...prev.filter(s => !(s.staffId === staffId && s.day === day)), { staffId, staffName: sn, day, start, end }]);
    setEditingShift(null);
  }
  function removeShift(staffId: string, day: number) {
    setShifts(prev => prev.filter(s => !(s.staffId === staffId && s.day === day)));
  }
  function getShift(staffId: string, day: number) {
    return shifts.find(s => s.staffId === staffId && s.day === day);
  }

  // PDF出力
  function exportPDF() {
    const w = window.open("", "_blank");
    if (!w) return;
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>シフト表 - てんぽみえるくん</title>
      <style>body{font-family:"Hiragino Sans",sans-serif;padding:24px;font-size:12px}
      h1{font-size:16px;margin-bottom:4px}p.sub{color:#666;margin-bottom:16px;font-size:11px}
      table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:6px 8px;text-align:center}
      th{background:#f5f5f5;font-size:10px;text-transform:uppercase}
      .bar{background:#1a73e8;color:white;border-radius:3px;padding:2px 6px;font-size:10px;display:inline-block}
      .off{color:#ccc}</style></head><body>
      <h1>シフト表</h1><p class="sub">4月14日〜4月20日 | Come On Casino | てんぽみえるくん</p>
      <table><thead><tr><th>スタッフ</th>`;
    DAYS.forEach(d => { html += `<th>${d}</th>`; });
    html += `</tr></thead><tbody>`;
    STAFF_NAMES.forEach(s => {
      html += `<tr><td style="text-align:left;font-weight:600">${s.name}</td>`;
      DAYS.forEach((_, di) => {
        const shift = getShift(s.id, di);
        html += `<td>${shift ? `<span class="bar">${shift.start}:00-${shift.end}:00</span>` : '<span class="off">—</span>'}</td>`;
      });
      html += `</tr>`;
    });
    html += `</tbody></table></body></html>`;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  }

  const working = staff.filter(s => s.status === "working").length;
  const onBreak = staff.filter(s => s.status === "on_break").length;
  const pending = staff.filter(s => s.needsApproval).length;
  const TL_START = 14; const TL_END = 26; const TL_HOURS = TL_END - TL_START;

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
      )}

      {/* ===== シフト確認（タイムライン） ===== */}
      {tab === "shift" && (
        <div ref={shiftRef} className="bg-white border border-[#dadce0] rounded-[8px] overflow-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8eaed]">
            <button className="p-1 hover:bg-[#f0f1f3] rounded-[4px]"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-[13px] font-semibold">本日のシフト</span>
            <button className="p-1 hover:bg-[#f0f1f3] rounded-[4px]"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="flex border-b border-[#e8eaed]">
            <div className="w-28 flex-shrink-0 px-3 py-2 text-[11px] font-semibold text-[#9aa0a6] uppercase">スタッフ</div>
            <div className="flex-1 flex">
              {Array.from({ length: TL_HOURS }, (_, i) => i + TL_START).map(h => (
                <div key={h} className="flex-1 text-center py-2 text-[10px] font-semibold text-[#9aa0a6] border-l border-[#e8eaed]">{h}:00</div>
              ))}
            </div>
          </div>
          {STAFF_NAMES.map(s => {
            const shift = getShift(s.id, 0);
            const barLeft = shift ? ((parseInt(shift.start) - TL_START) / TL_HOURS) * 100 : 0;
            const barWidth = shift ? ((parseInt(shift.end) - parseInt(shift.start)) / TL_HOURS) * 100 : 0;
            return (
              <div key={s.id} className="flex border-b border-[#e8eaed] hover:bg-[#f5f6f8]">
                <div className="w-28 flex-shrink-0 px-3 py-3 text-[12px] font-medium">{s.name}</div>
                <div className="flex-1 relative h-10">
                  {Array.from({ length: TL_HOURS }, (_, i) => (
                    <div key={i} className="absolute top-0 bottom-0 border-l border-[#e8eaed]" style={{ left: `${(i / TL_HOURS) * 100}%` }} />
                  ))}
                  {shift && (
                    <div className="absolute top-1.5 bottom-1.5 rounded-[4px] bg-[#1a73e8] flex items-center px-2"
                      style={{ left: `${barLeft}%`, width: `${barWidth}%` }}>
                      <span className="text-[10px] text-white font-medium whitespace-nowrap">{shift.start}:00-{shift.end}:00</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== シフト作成（週間グリッド） ===== */}
      {tab === "create" && (
        <div className="bg-white border border-[#dadce0] rounded-[8px] overflow-auto">
          <div className="px-4 py-3 border-b border-[#e8eaed] flex items-center justify-between">
            <span className="text-[13px] font-semibold">4月14日〜4月20日 シフト作成</span>
          </div>
          <table className="w-full text-[12px]">
            <thead><tr className="border-b border-[#dadce0] bg-[#f5f6f8]">
              <th className="px-4 py-2 text-[11px] font-semibold text-[#9aa0a6] uppercase text-left w-28">スタッフ</th>
              {DAYS.map((d, i) => <th key={i} className="px-1 py-2 text-center text-[11px] font-semibold text-[#9aa0a6] uppercase">{d}</th>)}
            </tr></thead>
            <tbody>{STAFF_NAMES.map(s => (
              <tr key={s.id} className="border-b border-[#e8eaed]">
                <td className="px-4 py-2 font-medium text-[12px]">{s.name}</td>
                {DAYS.map((_, di) => {
                  const shift = getShift(s.id, di);
                  const isEditing = editingShift?.staffId === s.id && editingShift?.day === di;
                  return (
                    <td key={di} className="px-1 py-1.5 text-center">
                      {isEditing ? (
                        <div className="flex flex-col items-center gap-1 bg-[#e8f0fe] rounded-[4px] p-1.5">
                          <div className="flex items-center gap-1">
                            <input type="number" min={14} max={25} value={shiftStart} onChange={e => setShiftStart(e.target.value)}
                              className="w-10 text-[11px] text-center py-0.5 rounded border border-[#dadce0]" />
                            <span className="text-[10px] text-[#9aa0a6]">〜</span>
                            <input type="number" min={15} max={26} value={shiftEnd} onChange={e => setShiftEnd(e.target.value)}
                              className="w-10 text-[11px] text-center py-0.5 rounded border border-[#dadce0]" />
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => addShift(s.id, di, shiftStart, shiftEnd)} className="px-1.5 py-0.5 text-[10px] bg-[#1a73e8] text-white rounded-[3px]">OK</button>
                            <button onClick={() => setEditingShift(null)} className="px-1.5 py-0.5 text-[10px] border border-[#dadce0] rounded-[3px]">✕</button>
                          </div>
                        </div>
                      ) : shift ? (
                        <div className="group relative">
                          <span className="inline-block px-2 py-1 bg-[#e8f0fe] text-[#1a73e8] text-[10px] font-medium rounded-[4px] cursor-pointer"
                            onClick={() => { setEditingShift({ staffId: s.id, day: di }); setShiftStart(shift.start); setShiftEnd(shift.end); }}>
                            {shift.start}-{shift.end}
                          </span>
                          <button onClick={() => removeShift(s.id, di)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-[#c5221f] text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => { setEditingShift({ staffId: s.id, day: di }); setShiftStart("18"); setShiftEnd("24"); }}
                          className="w-8 h-8 rounded-[4px] border border-dashed border-[#dadce0] text-[#9aa0a6] hover:border-[#1a73e8] hover:text-[#1a73e8] hover:bg-[#e8f0fe] transition-colors flex items-center justify-center mx-auto">
                          <Plus className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
