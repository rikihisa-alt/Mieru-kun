import Link from "next/link";
import { ArrowLeft, Coins } from "lucide-react";

export default function ChipsPage() {
  const balance = 5000;
  const chips = [
    { id: "1", date: "04/10", change: +500, reason: "ゲーム獲得", balance: 5000 },
    { id: "2", date: "04/05", change: -200, reason: "ゲーム使用", balance: 4500 },
    { id: "3", date: "04/05", change: +1000, reason: "購入", balance: 4700 },
    { id: "4", date: "03/28", change: +2000, reason: "購入", balance: 3700 },
    { id: "5", date: "03/20", change: -500, reason: "ゲーム使用", balance: 1700 },
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
            <Coins size={14} />現在のチップ残高
          </span>
          <p className="ln-balance__value">
            {balance.toLocaleString()}
            <span className="ln-balance__value-unit">枚</span>
          </p>
        </section>

        {/* 履歴 */}
        <section>
          <h2 className="ln-h2" style={{ marginBottom: 8 }}>チップ履歴</h2>
          <div className="ln-list">
            {chips.map(c => (
              <div key={c.id} className="ln-list__item" style={{ justifyContent: "space-between" }}>
                <div>
                  <span className="ln-mute" style={{ marginRight: 8 }}>{c.date}</span>
                  <span>{c.reason}</span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <span className="ln-num" style={{ fontWeight: 700, color: c.change > 0 ? "var(--ln-accent-text)" : "var(--ln-danger)" }}>
                    {c.change > 0 ? "+" : ""}{c.change.toLocaleString()}
                  </span>
                  <span className="ln-mute ln-num" style={{ marginLeft: 8 }}>→{c.balance.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
