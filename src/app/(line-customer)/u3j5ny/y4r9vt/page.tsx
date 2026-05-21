"use client";

import { Activity, Users, Armchair, Flame } from "lucide-react";
import Link from "next/link";

export default function MemberLiveStatusPage() {
  const score = 0;
  const level = score >= 80 ? { label: "非常に混雑", color: "#c0392b" } : score >= 55 ? { label: "混雑", color: "#c87b1a" } : { label: "通常", color: "#3a8f7c" };

  return (
    <div className="space-y-4">
      <Link href="/u3j5ny" className="text-[12px] text-text-tertiary">← マイページ</Link>
      <h2 className="text-[16px] font-bold">店内状況</h2>

      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-4">
        <div className="flex items-baseline justify-between mb-3">
          <span className="text-[13px] text-text-secondary">現在の混雑度</span>
          <span className="text-[14px] font-bold" style={{ color: level.color }}>{level.label}</span>
        </div>
        <div className="h-2 bg-bg rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: level.color }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { icon: <Users className="w-4 h-4" />, label: "来店", value: "—" },
          { icon: <Armchair className="w-4 h-4" />, label: "空席", value: "—" },
          { icon: <Activity className="w-4 h-4" />, label: "リング", value: "—" },
          { icon: <Flame className="w-4 h-4" />, label: "トナメ", value: "—" },
        ].map((m) => (
          <div key={m.label} className="bg-bg-white border border-border rounded-[var(--radius)] p-3 flex items-center gap-2">
            <div className="w-8 h-8 rounded-[6px] bg-bg flex items-center justify-center text-text-secondary">{m.icon}</div>
            <div>
              <div className="text-[10px] text-text-tertiary">{m.label}</div>
              <div className="text-[13px] font-bold">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-text-tertiary">データは数分おきに更新されます</p>
    </div>
  );
}
