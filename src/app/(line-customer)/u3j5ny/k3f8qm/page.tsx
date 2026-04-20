"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function MemberReservationPage() {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("19:00");
  const [party, setParty] = useState(1);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8">
          <CheckCircle className="w-12 h-12 text-accent mx-auto mb-2" />
          <p className="text-[14px] font-semibold">予約リクエストを送信しました</p>
          <p className="text-[11px] text-text-tertiary mt-1">確定次第 LINE で通知します</p>
        </div>
        <Link href="/u3j5ny" className="block text-center text-[12px] text-accent">マイページへ戻る</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/u3j5ny" className="text-[12px] text-text-tertiary">← マイページ</Link>
      <h2 className="text-[16px] font-bold">来店予約</h2>

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] text-text-secondary mb-1">来店日</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-[11px] text-text-secondary mb-1">来店時間</label>
          <select value={slot} onChange={(e) => setSlot(e.target.value)}>
            {["18:00","19:00","20:00","21:00","22:00","23:00"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] text-text-secondary mb-1">人数</label>
          <input type="number" min={1} max={10} value={party} onChange={(e) => setParty(parseInt(e.target.value) || 1)} />
        </div>
        <div>
          <label className="block text-[11px] text-text-secondary mb-1">備考</label>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="トナメ参加希望 など" className="resize-none" />
        </div>
        <button onClick={() => setDone(true)} disabled={!date} className="w-full py-2.5 bg-accent text-white text-[14px] font-medium rounded-[var(--radius)] disabled:opacity-50">
          予約する
        </button>
      </div>
    </div>
  );
}
