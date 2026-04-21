"use client";

import { useAppStore } from "@/lib/store/app-store";
import { Activity, Users, Armchair, Timer, Flame } from "lucide-react";

export default function LiveStatusPage() {
  const { kpis, tables } = useAppStore();

  const totalSeats = tables.reduce((s, t) => s + t.max, 0);
  const occupiedSeats = tables.reduce((s, t) => s + t.occupied, 0);
  const freeSeats = totalSeats - occupiedSeats;

  const ringTables = tables.filter((t) => t.type === "リング");
  const ringActive = ringTables.filter((t) => t.occupied > 0).length;
  const tournamentTables = tables.filter((t) => t.type === "トナメ");
  const tournamentActive = tournamentTables.filter((t) => t.occupied > 0).length;

  // 混雑度算出: 来店人数・卓稼働率・待機想定の合成スコア
  const activeRate = totalSeats > 0 ? occupiedSeats / totalSeats : 0;
  const tableRate = kpis.totalTables > 0 ? kpis.activeTables / kpis.totalTables : 0;
  const score = Math.min(100, Math.round((activeRate * 60 + tableRate * 40) * 100));
  const level = score >= 80 ? { label: "非常に混雑", color: "#c0392b" } : score >= 55 ? { label: "混雑", color: "#c87b1a" } : score >= 30 ? { label: "通常", color: "#3a8f7c" } : { label: "空いている", color: "#5a6977" };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* 混雑度 */}
      <div>
        <div className="flex items-baseline gap-3 mb-3">
          <h2 className="t-heading">現在の混雑度</h2>
          <span className="text-[13px] font-semibold tracking-wider" style={{ color: level.color }}>
            {level.label}
          </span>
        </div>
        <div className="h-2 bg-bg-hover rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: level.color }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-text-tertiary">
          <span>0</span><span>50</span><span>100</span>
        </div>
      </div>

      {/* 指標 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric icon={<Users className="w-4 h-4" />} label="来店人数" value={`${kpis.visitors}名`} />
        <Metric icon={<Armchair className="w-4 h-4" />} label="空席" value={`${freeSeats} / ${totalSeats}`} />
        <Metric icon={<Activity className="w-4 h-4" />} label="リング稼働" value={`${ringActive} / ${ringTables.length}`} />
        <Metric icon={<Flame className="w-4 h-4" />} label="トナメ進行" value={`${tournamentActive} / ${tournamentTables.length}`} />
      </div>

      {/* 卓内訳 */}
      <div>
        <h3 className="t-subhead mb-2">卓別稼働</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border-light">
              <th className="px-3 py-2 data-th">卓</th>
              <th className="px-3 py-2 data-th">種別</th>
              <th className="px-3 py-2 data-th">稼働</th>
              <th className="px-3 py-2 data-th">占有率</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => {
              const pct = t.max > 0 ? (t.occupied / t.max) * 100 : 0;
              const color = pct >= 100 ? "#c0392b" : pct >= 70 ? "#c87b1a" : pct > 0 ? "#3a8f7c" : "#8e9baa";
              return (
                <tr key={t.name} className="border-b border-border-light">
                  <td className="px-3 py-2 font-medium">{t.name}</td>
                  <td className="px-3 py-2 text-text-secondary">{t.type}</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold" style={{ color }}>{t.occupied}</span>
                    <span className="text-text-tertiary"> / {t.max}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-[5px] w-32 bg-bg-hover rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-4 border-t border-border-light">
        <p className="text-[12px] text-text-tertiary flex items-center gap-1">
          <Timer className="w-3 h-3" />
          データは5秒ごとに自動更新（デモ環境では静的表示）
        </p>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card-glass flex items-center gap-3 !p-4">
      <div className="w-9 h-9 rounded-[10px] bg-accent-light flex items-center justify-center text-accent">{icon}</div>
      <div>
        <div className="t-caption">{label}</div>
        <div className="t-heading">{value}</div>
      </div>
    </div>
  );
}
