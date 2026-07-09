"use client";

import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { staffStore } from "@/lib/store/domain-stores";
import { staffFullName } from "@/lib/staff-data";
import { PageHeader, Btn, Panel, VStack, Chip, Empty, Kpis, Kpi } from "@/components/v2/ui";
import { FileDown } from "lucide-react";
import { printDoc, tableHtml, kpisHtml } from "@/lib/v2/pdf";

interface AttendanceRecord {
  staffId: string;
  date: string;     // YYYY-MM-DD
  clockIn?: string; // HH:MM
  clockOut?: string;
  breakMin: number;
}

function today() { return new Date().toISOString().slice(0, 10); }
function nowHM() { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }

// ===== 全角→半角数字変換 + 数字以外を除去 =====
function toHalfWidthDigits(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^\d]/g, "");
}

export default function AttendancePage() {
  const [staff] = usePersisted(staffStore);
  const [records, setRecords] = usePersistedState<AttendanceRecord[]>("v2_attendance_v1", []);
  const active = staff.filter(s => s.status === "active");
  const t = today();

  const recordFor = (sid: string) => records.find(r => r.staffId === sid && r.date === t);

  function clockIn(sid: string) {
    setRecords(prev => {
      const ex = prev.find(r => r.staffId === sid && r.date === t);
      if (ex) return prev.map(r => r === ex ? { ...r, clockIn: nowHM() } : r);
      return [...prev, { staffId: sid, date: t, clockIn: nowHM(), breakMin: 0 }];
    });
  }
  function clockOut(sid: string) {
    setRecords(prev => prev.map(r => r.staffId === sid && r.date === t ? { ...r, clockOut: nowHM() } : r));
  }
  function undoClockOut(sid: string) {
    if (!confirm("退勤を取り消して勤務中に戻しますか？")) return;
    setRecords(prev => prev.map(r => r.staffId === sid && r.date === t ? { ...r, clockOut: undefined } : r));
  }
  function setBreakMin(sid: string, v: number) {
    const safe = Number.isFinite(v) ? Math.max(0, Math.trunc(v)) : 0;
    setRecords(prev => prev.map(r => r.staffId === sid && r.date === t ? { ...r, breakMin: safe } : r));
  }

  const working = active.filter(s => { const r = recordFor(s.id); return r?.clockIn && !r.clockOut; }).length;
  const finished = active.filter(s => { const r = recordFor(s.id); return r?.clockIn && r.clockOut; }).length;

  return (
    <VStack gap={16}>
      <PageHeader title="勤怠" sub={t} action={
        <Btn onClick={() => {
          const body = kpisHtml([
            { label: "対象日", value: t },
            { label: "勤務中", value: `${working}名` },
            { label: "退勤済", value: `${finished}名` },
            { label: "未出勤", value: `${active.length - working - finished}名` },
          ]) + tableHtml(
            ["名前", "役職", "出勤", "退勤", "状態"],
            active.map(s => {
              const r = recordFor(s.id);
              const status = !r?.clockIn ? "未出勤" : !r.clockOut ? "勤務中" : "退勤済";
              return [staffFullName(s), s.role, r?.clockIn ?? "—", r?.clockOut ?? "—", status];
            }),
          );
          printDoc({ title: "勤怠タイムカード", subtitle: t, body, storeName: "てんぽみえるくん" });
        }}><FileDown size={14}/> PDF</Btn>
      } />
      <Kpis>
        <Kpi label="在籍" value={active.length} />
        <Kpi label="勤務中" value={working} />
        <Kpi label="退勤済" value={finished} />
        <Kpi label="未出勤" value={active.length - working - finished} />
      </Kpis>

      <Panel title="本日の勤怠">
        {active.length === 0 ? <Empty>従業員が登録されていません</Empty> : (
          <table className="v2-table">
            <thead><tr><th>名前</th><th>役職</th><th>出勤</th><th>退勤</th><th className="v2-num-cell">休憩(分)</th><th>状態</th><th></th></tr></thead>
            <tbody>
              {active.map(s => {
                const r = recordFor(s.id);
                const status = !r?.clockIn ? "off" : !r.clockOut ? "working" : "finished";
                return (
                  <tr key={s.id}>
                    <td>{staffFullName(s)}</td>
                    <td className="v2-sub">{s.role}</td>
                    <td className="v2-num">{r?.clockIn ?? "—"}</td>
                    <td className="v2-num">{r?.clockOut ?? "—"}</td>
                    <td className="v2-num-cell">
                      {r?.clockIn ? (
                        <input
                          type="number"
                          min={0}
                          value={r.breakMin}
                          onChange={(e) => setBreakMin(s.id, toHalfWidthDigits(e.target.value) === "" ? 0 : parseInt(toHalfWidthDigits(e.target.value), 10))}
                          style={{ width: 64, textAlign: "right" }}
                        />
                      ) : <span className="v2-mute">—</span>}
                    </td>
                    <td><Chip variant={status === "working" ? "success" : status === "finished" ? undefined : undefined}>{status === "working" ? "勤務中" : status === "finished" ? "退勤済" : "未出勤"}</Chip></td>
                    <td>
                      {!r?.clockIn ? <Btn size="xs" onClick={() => clockIn(s.id)}>出勤</Btn>
                       : !r.clockOut ? <Btn size="xs" onClick={() => clockOut(s.id)}>退勤</Btn>
                       : <Btn size="xs" variant="ghost" onClick={() => undoClockOut(s.id)}>取消</Btn>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>
    </VStack>
  );
}
