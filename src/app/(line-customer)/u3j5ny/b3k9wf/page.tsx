"use client";

import Link from "next/link";
import { Coins, Sparkles } from "lucide-react";

export default function MemberBalancePage() {
  return (
    <div className="space-y-4">
      <Link href="/u3j5ny" className="text-[12px] text-text-tertiary">← マイページ</Link>
      <h2 className="text-[16px] font-bold">保有残高</h2>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-3">
          <div className="text-[10px] text-text-tertiary flex items-center gap-1"><Coins className="w-3 h-3" />リング</div>
          <div className="text-[18px] font-bold" style={{ color: "#3a8f7c" }}>5,000<span className="text-[11px] font-normal text-text-tertiary ml-0.5">枚</span></div>
        </div>
        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-3">
          <div className="text-[10px] text-text-tertiary flex items-center gap-1"><Coins className="w-3 h-3" />サイド</div>
          <div className="text-[18px] font-bold" style={{ color: "#d97706" }}>1,800<span className="text-[11px] font-normal text-text-tertiary ml-0.5">枚</span></div>
        </div>
        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-3 col-span-2">
          <div className="text-[10px] text-text-tertiary flex items-center gap-1"><Sparkles className="w-3 h-3" />マルチケ</div>
          <div className="text-[22px] font-bold" style={{ color: "#7c3aed" }}>12<span className="text-[12px] font-normal text-text-tertiary ml-1">枚</span></div>
          <div className="text-[10px] text-text-tertiary mt-1">うち5枚は2026-06-30まで有効</div>
        </div>
      </div>

      <p className="text-[11px] text-text-tertiary">残高に反映されるまで時間がかかる場合があります</p>
    </div>
  );
}
