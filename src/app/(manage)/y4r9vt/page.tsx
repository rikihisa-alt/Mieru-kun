"use client";

import { useAppStore } from "@/lib/store/app-store";
import { Timer } from "lucide-react";

export default function LiveStatusPage() {
  const { kpis, tables } = useAppStore();

  const totalSeats = tables.reduce((s, t) => s + t.max, 0);
  const occupiedSeats = tables.reduce((s, t) => s + t.occupied, 0);
  const freeSeats = totalSeats - occupiedSeats;

  const ringTables = tables.filter((t) => t.type === "リング");
  const ringActive = ringTables.filter((t) => t.occupied > 0).length;
  const tournamentTables = tables.filter((t) => t.type === "トナメ");
  const tournamentActive = tournamentTables.filter((t) => t.occupied > 0).length;

  // 混雑度算出
  const activeRate = totalSeats > 0 ? occupiedSeats / totalSeats : 0;
  const tableRate = kpis.totalTables > 0 ? kpis.activeTables / kpis.totalTables : 0;
  const score = Math.min(100, Math.round((activeRate * 60 + tableRate * 40) * 100));
  const level =
    score >= 80 ? { label: "非常に混雑", color: "var(--danger-text)" }
    : score >= 55 ? { label: "混雑", color: "var(--warning-text)" }
    : score >= 30 ? { label: "通常", color: "var(--primary-text)" }
    : { label: "空いている", color: "var(--text-secondary)" };

  return (
    <div className="page-stack">
      {/* 数値ストリップ */}
      <section>
        <div className="flex items-end gap-8 flex-wrap">
          <KpiItem label="来店人数" value={kpis.visitors} unit="名" />
          <KpiItem label="空席" value={`${freeSeats} / ${totalSeats}`} />
          <KpiItem label="リング" value={`${ringActive} / ${ringTables.length}`} />
          <KpiItem label="トナメ" value={`${tournamentActive} / ${tournamentTables.length}`} />
        </div>
      </section>

      {/* 混雑度 */}
      <section className="glass-panel">
        <div className="flex items-baseline gap-3 mb-4">
          <p className="t-label">現在の混雑度</p>
          <span className="text-[14px] font-semibold" style={{ color: level.color }}>
            {level.label}
          </span>
          <span className="ml-auto t-xs text-text-tertiary">{score}</span>
        </div>
        <div className="h-2 bg-[rgba(28,46,60,0.06)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${score}%`, background: level.color }}
          />
        </div>
        <div className="flex justify-between mt-2 t-xs text-text-tertiary">
          <span>0</span><span>50</span><span>100</span>
        </div>
      </section>

      {/* 卓別稼働 */}
      <section className="glass-panel">
        <p className="t-label mb-3">卓別稼働</p>
        <table className="data-table">
          <thead>
            <tr>
              <th>卓</th>
              <th>種別</th>
              <th>稼働</th>
              <th>占有率</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => {
              const pct = t.max > 0 ? (t.occupied / t.max) * 100 : 0;
              const color = pct >= 100 ? "var(--danger-text)" : pct >= 70 ? "var(--warning-text)" : pct > 0 ? "var(--primary-text)" : "var(--text-tertiary)";
              return (
                <tr key={t.name}>
                  <td className="font-medium">{t.name}</td>
                  <td>
                    <span className="chip chip-neutral chip-sm">{t.type}</span>
                  </td>
                  <td>
                    <span className="font-semibold" style={{ color }}>{t.occupied}</span>
                    <span className="text-text-tertiary"> / {t.max}</span>
                  </td>
                  <td>
                    <div className="h-[4px] w-32 bg-[rgba(28,46,60,0.06)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-4 t-xs text-text-tertiary flex items-center gap-1">
          <Timer className="w-3 h-3" />
          データは数秒ごとに自動更新（デモ環境では静的表示）
        </p>
      </section>
    </div>
  );
}

function KpiItem({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value">{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
    </div>
  );
}

