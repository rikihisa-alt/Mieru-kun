import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function VisitHistoryPage() {
  const history = [
    { id: "1", date: "2026/04/10", amount: 8500, stay: "3時間20分" },
    { id: "2", date: "2026/04/05", amount: 12000, stay: "4時間10分" },
    { id: "3", date: "2026/03/28", amount: 5000, stay: "2時間" },
  ];

  return (
    <div className="ln-page">
      <div className="ln-stack">
        <Link href="/u3j5ny" className="ln-back">
          <ArrowLeft size={14} />戻る
        </Link>
        <h2 className="ln-h1">来店履歴</h2>
        {history.length === 0 ? (
          <p className="ln-empty">来店履歴はまだありません</p>
        ) : (
          <div className="ln-stack-sm">
            {history.map(h => (
              <div key={h.id} className="ln-card ln-card-compact">
                <div className="ln-mute" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>{h.date}</span><span>{h.stay}</span>
                </div>
                <p className="ln-num" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>¥{h.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

        <p className="ln-demo-note">※ 表示はサンプルです。正式公開時に実データに切り替わります</p>
      </div>
    </div>
  );
}
