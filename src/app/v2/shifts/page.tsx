"use client";

import { useMemo, useState } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { staffStore } from "@/lib/store/domain-stores";
import { staffFullName } from "@/lib/staff-data";
import { PageHeader, Btn, Panel, Field, Modal, VStack, HStack, Chip, Empty } from "@/components/v2/ui";
import { ChevronLeft, ChevronRight, FileDown, Copy, AlertTriangle, Trash2 } from "lucide-react";
import { printDoc } from "@/lib/v2/pdf";

// =================================================================
// 型定義
// =================================================================
interface ShiftEntry {
  id: string;
  staffId: string;
  date: string;    // YYYY-MM-DD
  start: string;   // HH:MM
  end: string;     // HH:MM
  role: string;
}

interface AttendanceRecord {
  staffId: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  breakMin: number;
}

const ROLE_PRESETS = ["ホール", "ディーラー", "キッチン", "レジ"];
const WEEKDAY_LABEL = ["月", "火", "水", "木", "金", "土", "日"];

// =================================================================
// 日付ユーティリティ
// =================================================================
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function todayISO(): string {
  return toISODate(new Date());
}
/** 指定日を含む週の月曜日を返す */
function mondayOf(d: Date): Date {
  const nd = new Date(d);
  const dow = nd.getDay(); // 0=日
  const diff = dow === 0 ? -6 : 1 - dow;
  nd.setDate(nd.getDate() + diff);
  nd.setHours(0, 0, 0, 0);
  return nd;
}
function addDays(d: Date, n: number): Date {
  const nd = new Date(d);
  nd.setDate(nd.getDate() + n);
  return nd;
}
function formatMD(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ===== 全角→半角(数字・コロン)変換 =====
function toHalfWidth(input: string): string {
  return input.replace(/[０-９：]/g, (c) => {
    if (c === "：") return ":";
    return String.fromCharCode(c.charCodeAt(0) - 0xfee0);
  });
}

/** "HH:MM" の妥当性チェック */
function isValidTime(v: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
}

/** 開始・終了(HH:MM)から実働時間(時)を算出。終了が開始以前なら日跨ぎとみなす */
function durationHours(start: string, end: string): number {
  if (!isValidTime(start) || !isValidTime(end)) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

// 15分刻みの時刻選択肢
const TIME_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return out;
})();

export default function ShiftsPage() {
  const [staff] = usePersisted(staffStore);
  const [shifts, setShifts] = usePersistedState<ShiftEntry[]>("v2_shifts_v1", []);
  const [attendance] = usePersistedState<AttendanceRecord[]>("v2_attendance_v1", []);

  const [weekOffset, setWeekOffset] = useState(0);

  const active = useMemo(() => staff.filter(s => s.status === "active"), [staff]);

  const weekStart = useMemo(() => addDays(mondayOf(new Date()), weekOffset * 7), [weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = weekDays[6];
  const t = todayISO();

  // ===== モーダル状態 =====
  const [editTarget, setEditTarget] = useState<{ staffId: string; date: string } | null>(null);
  const [draftStart, setDraftStart] = useState("18:00");
  const [draftEnd, setDraftEnd] = useState("23:00");
  const [draftRole, setDraftRole] = useState(ROLE_PRESETS[0]);
  const [draftRoleCustom, setDraftRoleCustom] = useState(false);

  function shiftFor(staffId: string, date: string): ShiftEntry | undefined {
    return shifts.find(s => s.staffId === staffId && s.date === date);
  }

  function openCell(staffId: string, date: string) {
    const ex = shiftFor(staffId, date);
    if (ex) {
      setDraftStart(ex.start);
      setDraftEnd(ex.end);
      const known = ROLE_PRESETS.includes(ex.role);
      setDraftRole(ex.role);
      setDraftRoleCustom(!known);
    } else {
      setDraftStart("18:00");
      setDraftEnd("23:00");
      setDraftRole(ROLE_PRESETS[0]);
      setDraftRoleCustom(false);
    }
    setEditTarget({ staffId, date });
  }

  function closeModal() {
    setEditTarget(null);
  }

  function saveShift() {
    if (!editTarget) return;
    const start = toHalfWidth(draftStart.trim());
    const end = toHalfWidth(draftEnd.trim());
    if (!isValidTime(start) || !isValidTime(end)) {
      alert("時刻は HH:MM 形式で入力してください");
      return;
    }
    const role = draftRole.trim() || "ホール";
    const { staffId, date } = editTarget;
    setShifts(prev => {
      const ex = prev.find(s => s.staffId === staffId && s.date === date);
      if (ex) {
        return prev.map(s => s === ex ? { ...s, start, end, role } : s);
      }
      return [...prev, { id: `sh${Date.now()}${Math.random().toString(36).slice(2, 6)}`, staffId, date, start, end, role }];
    });
    closeModal();
  }

  function deleteShift() {
    if (!editTarget) return;
    const { staffId, date } = editTarget;
    setShifts(prev => prev.filter(s => !(s.staffId === staffId && s.date === date)));
    closeModal();
  }

  // ===== 先週のシフトをコピー =====
  function copyLastWeek() {
    if (!confirm("先週のシフトを今週にコピーします。今週の既存シフトは上書きされます。よろしいですか？")) return;
    const lastWeekStart = addDays(weekStart, -7);
    const lastWeekDays = Array.from({ length: 7 }, (_, i) => toISODate(addDays(lastWeekStart, i)));
    const thisWeekDates = weekDays.map(toISODate);
    setShifts(prev => {
      // 今週分を除去
      const kept = prev.filter(s => !thisWeekDates.includes(s.date));
      const copied: ShiftEntry[] = [];
      lastWeekDays.forEach((ld, i) => {
        const nd = thisWeekDates[i];
        prev.filter(s => s.date === ld).forEach(s => {
          copied.push({ id: `sh${Date.now()}${Math.random().toString(36).slice(2, 6)}${i}`, staffId: s.staffId, date: nd, start: s.start, end: s.end, role: s.role });
        });
      });
      return [...kept, ...copied];
    });
  }

  // ===== 日ごとの人数合計 =====
  const dailyCount = useMemo(() => {
    const map = new Map<string, number>();
    weekDays.forEach(d => {
      const iso = toISODate(d);
      map.set(iso, shifts.filter(s => s.date === iso && active.some(a => a.id === s.staffId)).length);
    });
    return map;
  }, [weekDays, shifts, active]);

  // ===== 従業員ごとの週合計時間 =====
  function weeklyHoursFor(staffId: string): number {
    const dates = weekDays.map(toISODate);
    return shifts
      .filter(s => s.staffId === staffId && dates.includes(s.date))
      .reduce((sum, s) => sum + durationHours(s.start, s.end), 0);
  }

  // ===== 当日: シフトあり未出勤の警告判定 =====
  function isNoShowWarning(staffId: string, date: string): boolean {
    if (date !== t) return false;
    const sh = shiftFor(staffId, date);
    if (!sh) return false;
    const att = attendance.find(a => a.staffId === staffId && a.date === date);
    return !att?.clockIn;
  }

  // ===== PDF出力 =====
  function handlePrint() {
    const dates = weekDays.map(toISODate);
    const headCells = weekDays.map((d, i) => `<th>${WEEKDAY_LABEL[i]} ${formatMD(d)}</th>`).join("");
    const rows = active.map(s => {
      const cells = dates.map(date => {
        const sh = shiftFor(s.id, date);
        if (!sh) return `<td class="mute">—</td>`;
        return `<td>${sh.start}-${sh.end}<br/><span class="badge">${escapeHtml(sh.role)}</span></td>`;
      }).join("");
      return `<tr><td>${escapeHtml(staffFullName(s))}</td>${cells}<td class="num">${weeklyHoursFor(s.id).toFixed(1)}h</td></tr>`;
    }).join("");
    const footCells = dates.map(date => `<td class="num">${dailyCount.get(date) ?? 0}名</td>`).join("");
    const body = `
      <table>
        <thead><tr><th>従業員</th>${headCells}<th>週合計</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td class="mute">人数合計</td>${footCells}<td></td></tr></tfoot>
      </table>
    `;
    printDoc({
      title: "週間シフト表",
      subtitle: `${formatMD(weekStart)} 〜 ${formatMD(weekEnd)}`,
      body,
      landscape: true,
      storeName: "てんぽみえるくん",
    });
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="シフト管理"
        sub={`${weekStart.getFullYear()}/${formatMD(weekStart)} 〜 ${formatMD(weekEnd)}`}
        action={
          <>
            <Btn variant="ghost" onClick={() => setWeekOffset(0)}>今週</Btn>
            <Btn variant="ghost" onClick={() => setWeekOffset(v => v - 1)}><ChevronLeft size={14} /> 前週</Btn>
            <Btn variant="ghost" onClick={() => setWeekOffset(v => v + 1)}>次週 <ChevronRight size={14} /></Btn>
            <Btn onClick={copyLastWeek}><Copy size={14} /> 先週のシフトをコピー</Btn>
            <Btn onClick={handlePrint}><FileDown size={14} /> PDF</Btn>
          </>
        }
      />

      <Panel title="週間シフト">
        {active.length === 0 ? (
          <Empty>在籍中の従業員が登録されていません</Empty>
        ) : (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead>
                <tr>
                  <th>従業員</th>
                  {weekDays.map((d, i) => {
                    const iso = toISODate(d);
                    const isToday = iso === t;
                    return (
                      <th key={iso} style={isToday ? { color: "var(--v2-accent)" } : undefined}>
                        {WEEKDAY_LABEL[i]} {formatMD(d)}
                      </th>
                    );
                  })}
                  <th className="v2-num-cell">週合計</th>
                </tr>
              </thead>
              <tbody>
                {active.map(s => (
                  <tr key={s.id}>
                    <td className="v2-sub">{staffFullName(s)}</td>
                    {weekDays.map(d => {
                      const iso = toISODate(d);
                      const sh = shiftFor(s.id, iso);
                      const warn = isNoShowWarning(s.id, iso);
                      return (
                        <td
                          key={iso}
                          onClick={() => openCell(s.id, iso)}
                          style={{ cursor: "pointer", minWidth: 96 }}
                        >
                          {sh ? (
                            <VStack gap={2}>
                              <span style={{ fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{sh.start}-{sh.end}</span>
                              <HStack gap={4}>
                                <Chip>{sh.role}</Chip>
                                {warn && (
                                  <span title="シフトはありますが未出勤です" style={{ color: "var(--v2-danger)", display: "inline-flex", alignItems: "center" }}>
                                    <AlertTriangle size={12} />
                                  </span>
                                )}
                              </HStack>
                            </VStack>
                          ) : (
                            <span className="v2-mute">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="v2-num-cell">{weeklyHoursFor(s.id).toFixed(1)}h</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td className="v2-mute">人数合計</td>
                  {weekDays.map(d => {
                    const iso = toISODate(d);
                    return <td key={iso} className="v2-num-cell">{dailyCount.get(iso) ?? 0}名</td>;
                  })}
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={!!editTarget}
        onClose={closeModal}
        title={editTarget ? `${staffFullName(active.find(a => a.id === editTarget.staffId) ?? { lastName: "", firstName: "" })} — ${editTarget.date}` : ""}
        footer={
          <>
            {shiftFor(editTarget?.staffId ?? "", editTarget?.date ?? "") && (
              <Btn variant="danger" onClick={deleteShift}><Trash2 size={14} /> 削除</Btn>
            )}
            <Btn variant="ghost" onClick={closeModal}>キャンセル</Btn>
            <Btn variant="primary" onClick={saveShift}>保存</Btn>
          </>
        }
      >
        <VStack gap={12}>
          <HStack gap={12} style={{ alignItems: "flex-start" }}>
            <Field label="開始時刻" required>
              <select
                value={TIME_OPTIONS.includes(draftStart) ? draftStart : ""}
                onChange={(e) => setDraftStart(e.target.value)}
              >
                {!TIME_OPTIONS.includes(draftStart) && <option value="">{draftStart}</option>}
                {TIME_OPTIONS.map(tm => <option key={tm} value={tm}>{tm}</option>)}
              </select>
            </Field>
            <Field label="終了時刻" required>
              <select
                value={TIME_OPTIONS.includes(draftEnd) ? draftEnd : ""}
                onChange={(e) => setDraftEnd(e.target.value)}
              >
                {!TIME_OPTIONS.includes(draftEnd) && <option value="">{draftEnd}</option>}
                {TIME_OPTIONS.map(tm => <option key={tm} value={tm}>{tm}</option>)}
              </select>
            </Field>
          </HStack>
          <Field label="直接入力(任意)" hint="全角数字・全角コロンも入力可。例: 18:00 / １８：００">
            <HStack gap={8}>
              <input
                type="text"
                value={draftStart}
                onChange={(e) => setDraftStart(toHalfWidth(e.target.value))}
                placeholder="開始 HH:MM"
                style={{ width: 100 }}
              />
              <span className="v2-mute">〜</span>
              <input
                type="text"
                value={draftEnd}
                onChange={(e) => setDraftEnd(toHalfWidth(e.target.value))}
                placeholder="終了 HH:MM"
                style={{ width: 100 }}
              />
            </HStack>
          </Field>
          <Field label="役割" required>
            <VStack gap={8}>
              <select
                value={draftRoleCustom ? "__custom__" : draftRole}
                onChange={(e) => {
                  if (e.target.value === "__custom__") {
                    setDraftRoleCustom(true);
                    setDraftRole("");
                  } else {
                    setDraftRoleCustom(false);
                    setDraftRole(e.target.value);
                  }
                }}
              >
                {ROLE_PRESETS.map(r => <option key={r} value={r}>{r}</option>)}
                <option value="__custom__">その他(自由入力)</option>
              </select>
              {draftRoleCustom && (
                <input
                  type="text"
                  value={draftRole}
                  onChange={(e) => setDraftRole(e.target.value)}
                  placeholder="役割を入力"
                />
              )}
            </VStack>
          </Field>
        </VStack>
      </Modal>
    </VStack>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
