"use client";

import Link from "next/link";
import { Trophy, Medal } from "lucide-react";

const TOP5 = [
  { rank: 1, nickname: "ハナ", value: 3800 },
  { rank: 2, nickname: "タロウ", value: 2900 },
  { rank: 3, nickname: "ユウ", value: 2500 },
  { rank: 4, nickname: "ショウ", value: 1800 },
  { rank: 5, nickname: "あなた", value: 1420, self: true },
];

export default function MemberRankingPage() {
  return (
    <div className="space-y-4">
      <Link href="/u3j5ny" className="text-[12px] text-text-tertiary">← マイページ</Link>
      <h2 className="text-[16px] font-bold flex items-center gap-2">
        <Trophy className="w-5 h-5 text-[#d97706]" />
        月間ランキング
      </h2>
      <p className="text-[11px] text-text-tertiary">来店ポイント 月間集計</p>

      <div className="space-y-2">
        {TOP5.map((r) => (
          <div key={r.rank} className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius)] ${r.self ? "bg-[#e8f5f0] border border-accent/30" : "bg-bg-white border border-border"}`}>
            <span className="w-7 text-center">
              {r.rank <= 3 ? <Medal className="w-4 h-4 mx-auto" style={{ color: r.rank === 1 ? "#d97706" : r.rank === 2 ? "#6b7280" : "#a16207" }} /> : <span className="text-[12px] text-text-tertiary font-mono">{r.rank}</span>}
            </span>
            <span className="flex-1 text-[14px] font-medium">{r.nickname}{r.self && <span className="text-[10px] text-accent ml-1">YOU</span>}</span>
            <span className="text-[14px] font-bold">{r.value.toLocaleString()} pt</span>
          </div>
        ))}
      </div>
    </div>
  );
}
