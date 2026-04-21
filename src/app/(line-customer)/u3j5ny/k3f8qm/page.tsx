"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Calendar, Clock, Users, AlertTriangle, X } from "lucide-react";

type TableKind = "tournament" | "ring" | "side" | "any";

interface ExistingReservation {
  id: string;
  date: string;
  time: string;
  party: number;
  kind: TableKind;
  status: "confirmed" | "pending";
}

const KIND_LABEL: Record<TableKind, string> = {
  any: "指定なし",
  tournament: "トナメ",
  ring: "リング",
  side: "サイド",
};

// 時間帯ごとの混雑ヒント(0=空き、1=普通、2=混雑)
const CONGESTION: Record<string, 0 | 1 | 2> = {
  "18:00": 0, "19:00": 1, "20:00": 2, "21:00": 2, "22:00": 1, "23:00": 0,
};

const MY_RESERVATIONS: ExistingReservation[] = [
  { id: "r1", date: "2026-04-25", time: "20:00", party: 2, kind: "tournament", status: "confirmed" },
  { id: "r2", date: "2026-05-02", time: "22:00", party: 1, kind: "any", status: "pending" },
];

export default function MemberReservationPage() {
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("19:00");
  const [party, setParty] = useState(1);
  const [kind, setKind] = useState<TableKind>("any");
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const [myReservations, setMyReservations] = useState(MY_RESERVATIONS);

  const todayISO = new Date().toISOString().split("T")[0];

  function submit() {
    if (!date) return;
    setDone(true);
  }

  function cancelReservation(id: string) {
    if (!confirm("予約をキャンセルしますか？")) return;
    setMyReservations(prev => prev.filter(r => r.id !== id));
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="text-center py-10">
          <CheckCircle className="w-14 h-14 text-accent mx-auto mb-3" />
          <p className="text-[15px] font-semibold">予約リクエストを送信しました</p>
          <p className="text-[12px] text-text-tertiary mt-1.5">確定次第 LINE で通知します</p>
          <div className="mt-4 inline-block bg-bg-white border border-border rounded-[var(--radius)] px-4 py-3 text-left">
            <p className="text-[11px] text-text-tertiary">予約内容</p>
            <p className="text-[13px] font-medium mt-1">{date} {slot}〜</p>
            <p className="text-[12px] text-text-secondary">{party}名・{KIND_LABEL[kind]}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setDone(false); setDate(""); setNote(""); setParty(1); setKind("any"); }}
            className="flex-1 py-2.5 border border-border text-[13px] rounded-[var(--radius)]"
          >
            続けて予約
          </button>
          <Link href="/u3j5ny" className="flex-1 py-2.5 bg-accent text-white text-[13px] font-medium rounded-[var(--radius)] text-center">
            マイページへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link href="/u3j5ny" className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary">
        <ArrowLeft className="w-3.5 h-3.5" />マイページへ
      </Link>

      <h2 className="text-[16px] font-bold flex items-center gap-1.5">
        <Calendar className="w-4 h-4" />来店予約
      </h2>

      {/* 予約中の一覧 */}
      {myReservations.length > 0 && (
        <section>
          <p className="text-[11px] text-text-tertiary mb-1.5">予約中</p>
          <div className="space-y-1.5">
            {myReservations.map(r => (
              <div key={r.id} className="bg-bg-white border border-border rounded-[var(--radius)] px-3 py-2.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium">{r.date.slice(5)} {r.time}</span>
                    {r.status === "pending" && (
                      <span className="chip chip-warning" style={{ fontSize: 10 }}>確定待ち</span>
                    )}
                    {r.status === "confirmed" && (
                      <span className="chip chip-success" style={{ fontSize: 10 }}>確定</span>
                    )}
                  </div>
                  <p className="text-[11px] text-text-tertiary mt-0.5">{r.party}名・{KIND_LABEL[r.kind]}</p>
                </div>
                <button
                  onClick={() => cancelReservation(r.id)}
                  className="p-1.5 text-text-tertiary hover:text-status-danger"
                  aria-label="キャンセル"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 予約フォーム */}
      <section className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-4 space-y-3">
        <p className="text-[12px] font-semibold text-text-primary">新規予約</p>

        <div>
          <label className="block text-[11px] text-text-secondary mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3" />来店日
          </label>
          <input type="date" value={date} min={todayISO} onChange={(e) => setDate(e.target.value)} />
        </div>

        <div>
          <label className="block text-[11px] text-text-secondary mb-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />来店時間
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.keys(CONGESTION).map(t => {
              const c = CONGESTION[t];
              const active = slot === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSlot(t)}
                  className={`py-2 text-[12px] font-medium rounded-[6px] border transition-colors ${
                    active ? "bg-accent text-white border-accent" : "bg-bg-white text-text-primary border-border hover:bg-bg-hover"
                  }`}
                >
                  <div>{t}</div>
                  <div className="text-[9px] mt-0.5 opacity-80">
                    {c === 0 ? "◎空き" : c === 1 ? "◯普通" : "△混雑"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-text-secondary mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" />人数
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setParty(Math.max(1, party - 1))}
              className="w-9 h-9 border border-border rounded-[6px] text-[16px] font-bold"
            >−</button>
            <span className="flex-1 text-center text-[15px] font-bold tabular-nums">{party}名</span>
            <button
              type="button"
              onClick={() => setParty(Math.min(10, party + 1))}
              className="w-9 h-9 border border-border rounded-[6px] text-[16px] font-bold"
            >+</button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-text-secondary mb-1">卓種別</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(KIND_LABEL) as TableKind[]).map(k => {
              const active = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`py-2 text-[11px] font-medium rounded-[6px] border transition-colors ${
                    active ? "bg-accent text-white border-accent" : "bg-bg-white text-text-primary border-border hover:bg-bg-hover"
                  }`}
                >
                  {KIND_LABEL[k]}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-text-secondary mb-1">備考(任意)</label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="トナメ参加希望 / 誕生日利用 など"
            className="resize-none"
          />
        </div>

        <button
          onClick={submit}
          disabled={!date}
          className="w-full py-2.5 bg-accent text-white text-[14px] font-medium rounded-[var(--radius)] disabled:opacity-50"
        >
          予約を送信
        </button>
      </section>

      <div className="flex items-start gap-1.5 px-1">
        <AlertTriangle className="w-3 h-3 text-text-tertiary flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-text-tertiary leading-[1.6]">
          ご予約はリクエスト送信後、店舗スタッフが確認して確定します。
          確定 or キャンセル依頼はLINEで通知されます。
        </p>
      </div>
    </div>
  );
}
