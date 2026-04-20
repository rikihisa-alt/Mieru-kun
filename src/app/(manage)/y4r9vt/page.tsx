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
          <h2 className="text-[15px] font-semibold text-[#2c3e50]">現在の混雑度</h2>
          <span className="text-[13px] font-semibold tracking-wider" style={{ color: level.color }}>
            {level.label}
          </span>
        </div>
        <div className="h-2 bg-[#f3f0ec] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: level.color }} />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-[#8e9baa]">
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
        <h3 className="text-[13px] font-semibold text-[#2c3e50] mb-2">卓別稼働</h3>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#e8e4df]">
              <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">卓</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">種別</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">稼働</th>
              <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">占有率</th>
            </tr>
          </thead>
          <tbody>
            {tables.map((t) => {
              const pct = t.max > 0 ? (t.occupied / t.max) * 100 : 0;
              const color = pct >= 100 ? "#c0392b" : pct >= 70 ? "#c87b1a" : pct > 0 ? "#3a8f7c" : "#8e9baa";
              return (
                <tr key={t.name} className="border-b border-[#f3f0ec]">
                  <td className="px-3 py-2 font-medium">{t.name}</td>
                  <td className="px-3 py-2 text-[#5a6977]">{t.type}</td>
                  <td className="px-3 py-2">
                    <span className="font-semibold" style={{ color }}>{t.occupied}</span>
                    <span className="text-[#8e9baa]"> / {t.max}</span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="h-[5px] w-32 bg-[#f3f0ec] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pt-4 border-t border-[#e8e4df]">
        <p className="text-[12px] text-[#8e9baa] flex items-center gap-1">
          <Timer className="w-3 h-3" />
          データは5秒ごとに自動更新（デモ環境では静的表示）
        </p>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border border-[#e8e4df] rounded-[6px]">
      <div className="w-8 h-8 rounded-[6px] bg-[#f3f0ec] flex items-center justify-center text-[#5a6977]">{icon}</div>
      <div>
        <div className="text-[11px] text-[#8e9baa]">{label}</div>
        <div className="text-[16px] font-bold text-[#2c3e50]">{value}</div>
      </div>
    </div>
  );
}
