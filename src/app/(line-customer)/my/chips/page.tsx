import Link from "next/link";
import { ArrowLeft, Coins, Trophy } from "lucide-react";

export default function ChipsPage() {
  const chips = [
    { id: "1", date: "04/10", change: +500, reason: "ゲーム獲得", balance: 5000 },
    { id: "2", date: "04/05", change: -200, reason: "ゲーム使用", balance: 4500 },
    { id: "3", date: "04/05", change: +1000, reason: "購入", balance: 4700 },
  ];
  const points = [
    { id: "1", date: "04/10", change: +100, reason: "来店ポイント", balance: 1200 },
    { id: "2", date: "04/05", change: +150, reason: "来店ポイント", balance: 1100 },
  ];

  return (
    <div className="space-y-4">
      <Link href="/my" className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary">
        <ArrowLeft className="w-3.5 h-3.5" />戻る
      </Link>

      {/* チップ */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Coins className="w-4 h-4 text-text-tertiary" />
          <h2 className="text-[14px] font-bold">チップ履歴</h2>
        </div>
        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] divide-y divide-border-light">
          {chips.map(c => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5 text-[12px]">
              <div>
                <span className="text-text-tertiary mr-2">{c.date}</span>
                <span>{c.reason}</span>
              </div>
              <div className="text-right">
                <span className={`font-bold ${c.change > 0 ? "text-status-success" : "text-status-danger"}`}>
                  {c.change > 0 ? "+" : ""}{c.change.toLocaleString()}
                </span>
                <span className="text-text-tertiary ml-2">→{c.balance.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ポイント */}
      <section>
        <div className="flex items-center gap-1.5 mb-2">
          <Trophy className="w-4 h-4 text-text-tertiary" />
          <h2 className="text-[14px] font-bold">ポイント履歴</h2>
        </div>
        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] divide-y divide-border-light">
          {points.map(p => (
            <div key={p.id} className="flex items-center justify-between px-4 py-2.5 text-[12px]">
              <div>
                <span className="text-text-tertiary mr-2">{p.date}</span>
                <span>{p.reason}</span>
              </div>
              <div className="text-right">
                <span className="font-bold text-status-success">+{p.change.toLocaleString()}</span>
                <span className="text-text-tertiary ml-2">→{p.balance.toLocaleString()}pt</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
