import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";

export default function PointsPage() {
  const balance = 0;
  const points: { id: string; date: string; change: number; reason: string; balance: number }[] = [];

  return (
    <div className="space-y-4">
      <Link href="/u3j5ny" className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary">
        <ArrowLeft className="w-3.5 h-3.5" />マイページへ
      </Link>

      {/* 残高ヘッダー */}
      <section className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-5 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <Trophy className="w-4 h-4 text-text-tertiary" />
          <span className="text-[11px] text-text-tertiary">現在のポイント残高</span>
        </div>
        <p className="text-[32px] font-bold text-text-primary">
          {balance.toLocaleString()}
          <span className="text-[14px] font-normal text-text-tertiary ml-1">pt</span>
        </p>
      </section>

      {/* 履歴 */}
      <section>
        <h2 className="text-[14px] font-bold mb-2">ポイント履歴</h2>
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
