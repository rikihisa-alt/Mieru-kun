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
    <div className="space-y-4">
      <Link href="/u3j5ny" className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary">
        <ArrowLeft className="w-3.5 h-3.5" />マイページへ
      </Link>

      {/* 残高ヘッダー */}
      <section className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-5 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Sparkles className="w-4 h-4 text-text-tertiary" />
          <span className="text-[11px] text-text-tertiary">現在のマルチケ残高</span>
        </div>
        <p className="text-[32px] font-bold" style={{ color: "#7c3aed" }}>
          {balance.toLocaleString()}
          <span className="text-[14px] font-normal text-text-tertiary ml-1">枚</span>
        </p>
        {expiringSoon > 0 && (
          <p className="text-[11px] text-status-warning mt-2">
            うち{expiringSoon}枚は{expiringDate}まで有効
          </p>
        )}
      </section>

      {/* 履歴 */}
      <section>
        <h2 className="text-[14px] font-bold mb-2">マルチケ履歴</h2>
        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] divide-y divide-border-light">
          {history.map(h => (
            <div key={h.id} className="px-4 py-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-text-tertiary mr-2">{h.date}</span>
                  <span>{h.reason}</span>
                </div>
                <div className="text-right">
                  <span className={`font-bold ${h.change > 0 ? "text-status-success" : "text-status-danger"}`}>
                    {h.change > 0 ? "+" : ""}{h.change}
                  </span>
                  <span className="text-text-tertiary ml-2">→{h.balance}枚</span>
                </div>
              </div>
              {h.expiresAt && (
                <p className="text-[10px] text-text-tertiary mt-0.5">期限: {h.expiresAt}</p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
