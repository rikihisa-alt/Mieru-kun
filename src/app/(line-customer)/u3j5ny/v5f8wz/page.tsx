import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function VisitHistoryPage() {
  const history: { id: string; date: string; amount: number; stay: string }[] = [];

  return (
    <div className="space-y-3">
      <Link href="/u3j5ny" className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary">
        <ArrowLeft className="w-3.5 h-3.5" />戻る
      </Link>
      <h2 className="text-[15px] font-bold">来店履歴</h2>
      {history.length === 0 ? (
        <p className="text-center text-[12px] text-text-tertiary py-6">来店履歴はまだありません</p>
      ) : (
        <div className="space-y-2">
          {history.map(h => (
            <div key={h.id} className="bg-bg-white border border-border rounded-[var(--radius)] px-4 py-3">
              <div className="flex justify-between text-[12px] text-text-tertiary mb-1">{h.date}<span>{h.stay}</span></div>
              <p className="text-[15px] font-bold">¥{h.amount.toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
