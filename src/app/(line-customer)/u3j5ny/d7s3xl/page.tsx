"use client";

import Link from "next/link";
import { Calendar, Users } from "lucide-react";

const EVENTS = [
  { id: "e1", title: "春のVIPナイト", date: "2026/04/25", time: "20:00-02:00", capacity: 30, reserved: 18 },
  { id: "e2", title: "ウィークエンドトーナメント", date: "2026/04/27", time: "19:00-23:00", capacity: 40, reserved: 25 },
  { id: "e3", title: "新作カクテル試飲会", date: "2026/05/02", time: "22:00-23:00", capacity: 10, reserved: 3 },
];

export default function MemberEventsPage() {
  return (
    <div className="space-y-4">
      <Link href="/u3j5ny" className="text-[12px] text-text-tertiary">← マイページ</Link>
      <h2 className="text-[16px] font-bold">イベント</h2>

      <div className="space-y-3">
        {EVENTS.map((e) => {
          const pct = (e.reserved / e.capacity) * 100;
          return (
            <div key={e.id} className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-4 space-y-2">
              <h3 className="text-[14px] font-bold">{e.title}</h3>
              <div className="flex items-center gap-3 text-[11px] text-text-secondary">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{e.date} {e.time}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{e.reserved}/{e.capacity}</span>
              </div>
              <div className="h-1 bg-bg rounded-full overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <button className="w-full py-1.5 bg-accent text-white text-[12px] font-medium rounded-[var(--radius)]">
                予約する
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
