"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Construction, Calendar, Clock, Users, AlertTriangle, X } from "lucide-react";

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
      <div className="ln-page">
        <div className="ln-stack">
          <div style={{ textAlign: "center", padding: "32px 0 16px" }}>
            <Construction size={56} style={{ color: "var(--ln-warn)", margin: "0 auto 10px" }} />
            <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>この機能は準備中です</p>
            <p className="ln-mute" style={{ fontSize: 12, marginTop: 4, lineHeight: 1.7 }}>
              お手数ですが、ご予約はお電話または店頭にて承っております。
            </p>
            <div className="ln-card ln-card-compact" style={{ marginTop: 16, display: "inline-block", textAlign: "left" }}>
              <p className="ln-mute" style={{ fontSize: 11, margin: 0 }}>ご希望の内容</p>
              <p style={{ fontSize: 13, fontWeight: 500, margin: "4px 0 0" }}>{date} {slot}〜</p>
              <p className="ln-sub" style={{ fontSize: 12, margin: 0 }}>{party}名・{KIND_LABEL[kind]}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => { setDone(false); setDate(""); setNote(""); setParty(1); setKind("any"); }}
              className="ln-btn ln-btn--full"
            >
              入力に戻る
            </button>
            <Link href="/u3j5ny" className="ln-btn ln-btn--primary ln-btn--full">
              マイページへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ln-page">
      <div className="ln-stack">
        <Link href="/u3j5ny" className="ln-back">
          <ArrowLeft size={14} />マイページへ
        </Link>

        <h2 className="ln-h1" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Calendar size={18} />来店予約
        </h2>

        {/* 予約中の一覧 */}
        {myReservations.length > 0 && (
          <section>
            <div className="ln-row" style={{ marginBottom: 6 }}>
              <p className="ln-eyebrow" style={{ margin: 0 }}>予約中</p>
              <span style={{ fontSize: 9, color: "var(--ln-text-mute)", border: "1px solid var(--ln-border)", borderRadius: 999, padding: "1px 6px" }}>デモ表示</span>
            </div>
            <div className="ln-stack-sm">
              {myReservations.map(r => (
                <div key={r.id} className="ln-card ln-card-compact" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div className="ln-row">
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{r.date.slice(5)} {r.time}</span>
                      {r.status === "pending" && <span className="ln-chip ln-chip--warn">確定待ち</span>}
                      {r.status === "confirmed" && <span className="ln-chip ln-chip--success">確定</span>}
                    </div>
                    <p className="ln-mute" style={{ fontSize: 11, margin: "2px 0 0" }}>{r.party}名・{KIND_LABEL[r.kind]}</p>
                  </div>
                  <button
                    onClick={() => cancelReservation(r.id)}
                    className="ln-btn ln-btn--ghost ln-btn--sm"
                    aria-label="キャンセル"
                    style={{ padding: 6, height: 28 }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 予約フォーム */}
        <section className="ln-card">
          <p className="ln-eyebrow" style={{ marginBottom: 10 }}>新規予約</p>

          <div className="ln-stack-sm" style={{ gap: 14 }}>
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ln-text-sub)", marginBottom: 4 }}>
                <Calendar size={12} />来店日
              </label>
              <input type="date" value={date} min={todayISO} onChange={(e) => setDate(e.target.value)} />
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ln-text-sub)", marginBottom: 4 }}>
                <Clock size={12} />来店時間
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                {Object.keys(CONGESTION).map(t => {
                  const c = CONGESTION[t];
                  const active = slot === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSlot(t)}
                      className={active ? "ln-btn ln-btn--selected" : "ln-btn"}
                      style={{ height: "auto", padding: "8px 4px", flexDirection: "column", gap: 2 }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{t}</div>
                      <div style={{ fontSize: 9, opacity: 0.85 }}>
                        {c === 0 ? "◎空き" : c === 1 ? "◯普通" : "△混雑"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ln-text-sub)", marginBottom: 4 }}>
                <Users size={12} />人数
              </label>
              <div className="ln-row">
                <button
                  type="button"
                  onClick={() => setParty(Math.max(1, party - 1))}
                  className="ln-btn"
                  style={{ width: 38, height: 38, padding: 0, fontSize: 16, fontWeight: 700 }}
                >−</button>
                <span className="ln-grow ln-num" style={{ textAlign: "center", fontSize: 15, fontWeight: 700 }}>{party}名</span>
                <button
                  type="button"
                  onClick={() => setParty(Math.min(10, party + 1))}
                  className="ln-btn"
                  style={{ width: 38, height: 38, padding: 0, fontSize: 16, fontWeight: 700 }}
                >+</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: "var(--ln-text-sub)", display: "block", marginBottom: 4 }}>卓種別</label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
                {(Object.keys(KIND_LABEL) as TableKind[]).map(k => {
                  const active = kind === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setKind(k)}
                      className={active ? "ln-btn ln-btn--selected" : "ln-btn"}
                      style={{ height: 36, padding: "0 6px", fontSize: 11 }}
                    >
                      {KIND_LABEL[k]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label style={{ fontSize: 11, color: "var(--ln-text-sub)", display: "block", marginBottom: 4 }}>備考(任意)</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="トナメ参加希望 / 誕生日利用 など"
                style={{ resize: "none" }}
              />
            </div>

            <button
              onClick={submit}
              disabled={!date}
              className="ln-btn ln-btn--primary ln-btn--full ln-btn--lg"
              style={{ opacity: !date ? 0.5 : 1 }}
            >
              予約を送信
            </button>
          </div>
        </section>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "0 4px" }}>
          <AlertTriangle size={12} className="ln-mute" style={{ flexShrink: 0, marginTop: 2 }} />
          <p className="ln-mute" style={{ fontSize: 10, lineHeight: 1.6, margin: 0 }}>
            オンラインでのご予約機能は準備中です。ご予約はお電話または店頭にて承っております。
          </p>
        </div>

        <p className="ln-demo-note">※ 表示はサンプルです。正式公開時に実データに切り替わります</p>
      </div>
    </div>
  );
}
