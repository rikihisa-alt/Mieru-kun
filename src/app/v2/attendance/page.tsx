"use client";

import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { staffStore } from "@/lib/store/domain-stores";
import { staffFullName } from "@/lib/staff-data";
import { PageHeader, Btn, Panel, VStack, Chip, Empty, Kpis, Kpi } from "@/components/v2/ui";

interface AttendanceRecord {
  staffId: string;
  date: string;     // YYYY-MM-DD
  clockIn?: string; // HH:MM
  clockOut?: string;
  breakMin: number;
}

function today() { return new Date().toISOString().slice(0, 10); }
function nowHM() { const d = new Date(); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; }

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

  const working = active.filter(s => { const r = recordFor(s.id); return r?.clockIn && !r.clockOut; }).length;
  const finished = active.filter(s => { const r = recordFor(s.id); return r?.clockIn && r.clockOut; }).length;

  return (
    <VStack gap={16}>
      <PageHeader title="勤怠" sub={t} />
      <Kpis>
        <Kpi label="在籍" value={active.length} />
        <Kpi label="勤務中" value={working} />
        <Kpi label="退勤済" value={finished} />
        <Kpi label="未出勤" value={active.length - working - finished} />
      </Kpis>

      <Panel title="本日の勤怠">
        {active.length === 0 ? <Empty>従業員が登録されていません</Empty> : (
          <table className="v2-table">
            <thead><tr><th>名前</th><th>役職</th><th>出勤</th><th>退勤</th><th>状態</th><th></th></tr></thead>
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
                    <td><Chip variant={status === "working" ? "success" : status === "finished" ? undefined : undefined}>{status === "working" ? "勤務中" : status === "finished" ? "退勤済" : "未出勤"}</Chip></td>
                    <td>
                      {!r?.clockIn ? <Btn size="xs" onClick={() => clockIn(s.id)}>出勤</Btn>
                       : !r.clockOut ? <Btn size="xs" onClick={() => clockOut(s.id)}>退勤</Btn>
                       : <span className="v2-mute" style={{ fontSize: 11 }}>完了</span>}
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
