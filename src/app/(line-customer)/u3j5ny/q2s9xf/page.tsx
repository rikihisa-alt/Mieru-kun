import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";

export default function PointsPage() {
  const balance = 1200;
  const points = [
    { id: "1", date: "04/10", change: +100, reason: "来店ポイント", balance: 1200 },
    { id: "2", date: "04/05", change: +150, reason: "来店ポイント", balance: 1100 },
    { id: "3", date: "04/01", change: +200, reason: "イベント参加", balance: 950 },
    { id: "4", date: "03/25", change: +500, reason: "¥10,000利用特典", balance: 750 },
    { id: "5", date: "03/20", change: +100, reason: "来店ポイント", balance: 250 },
  ];

  return (
    <div className="ln-page">
      <div className="ln-stack">
        <Link href="/u3j5ny" className="ln-back">
          <ArrowLeft size={14} />マイページへ
        </Link>

        {/* 残高ヘッダー */}
        <section className="ln-card ln-card-lg ln-balance">
          <span className="ln-balance__label">
            <Trophy size={14} />現在のポイント残高
          </span>
          <p className="ln-balance__value">
            {balance.toLocaleString()}
            <span className="ln-balance__value-unit">pt</span>
          </p>
        </section>

        {/* 履歴 */}
        <section>
          <h2 className="ln-h2" style={{ marginBottom: 8 }}>ポイント履歴</h2>
          <div className="ln-list">
            {points.map(p => (
              <div key={p.id} className="ln-list__item" style={{ justifyContent: "space-between" }}>
                <div>
                  <span className="ln-mute" style={{ marginRight: 8 }}>{p.date}</span>
                  <span>{p.reason}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="ln-num" style={{ fontWeight: 700, color: "var(--ln-accent-text)" }}>+{p.change.toLocaleString()}</span>
                  <span className="ln-mute ln-num" style={{ marginLeft: 8 }}>→{p.balance.toLocaleString()}pt</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
