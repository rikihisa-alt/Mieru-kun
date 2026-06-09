import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function MultikePage() {
  const balance = 12;
  const expiringSoon = 5;
  const expiringDate = "2026-06-30";

  const history = [
    { id: "1", date: "04/10", change: +5, reason: "キャンペーン配布: 春の感謝祭", balance: 12, expiresAt: "2026-06-30" },
    { id: "2", date: "04/05", change: +3, reason: "手動付与", balance: 7, expiresAt: "2026-05-30" },
    { id: "3", date: "04/01", change: -2, reason: "消化", balance: 4, expiresAt: null },
    { id: "4", date: "03/20", change: +6, reason: "来店特典", balance: 6, expiresAt: "2026-05-20" },
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
            <Sparkles size={14} />現在のマルチケ残高
          </span>
          <p className="ln-balance__value" style={{ color: "#7c3aed" }}>
            {balance.toLocaleString()}
            <span className="ln-balance__value-unit">枚</span>
          </p>
          {expiringSoon > 0 && (
            <p style={{ fontSize: 11, color: "var(--ln-warn)", marginTop: 8 }}>
              うち{expiringSoon}枚は{expiringDate}まで有効
            </p>
          )}
        </section>

        {/* 履歴 */}
        <section>
          <h2 className="ln-h2" style={{ marginBottom: 8 }}>マルチケ履歴</h2>
          <div className="ln-list">
            {history.map(h => (
              <div key={h.id} className="ln-list__item" style={{ flexDirection: "column", alignItems: "stretch", gap: 2 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span className="ln-mute" style={{ marginRight: 8 }}>{h.date}</span>
                    <span>{h.reason}</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span className="ln-num" style={{ fontWeight: 700, color: h.change > 0 ? "var(--ln-accent-text)" : "var(--ln-danger)" }}>
                      {h.change > 0 ? "+" : ""}{h.change}
                    </span>
                    <span className="ln-mute ln-num" style={{ marginLeft: 8 }}>→{h.balance}枚</span>
                  </div>
                </div>
                {h.expiresAt && (
                  <p className="ln-mute" style={{ fontSize: 10, margin: 0 }}>期限: {h.expiresAt}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
