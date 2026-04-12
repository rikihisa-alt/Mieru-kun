import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function VisitHistoryPage() {
  const history = [
    { id: "1", date: "2026/04/10", amount: 8500, stay: "3時間20分" },
    { id: "2", date: "2026/04/05", amount: 12000, stay: "4時間10分" },
    { id: "3", date: "2026/03/28", amount: 5000, stay: "2時間" },
  ];

  return (
    <div className="space-y-3">
      <Link href="/my" className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary">
        <ArrowLeft className="w-3.5 h-3.5" />戻る
      </Link>
      <h2 className="text-[15px] font-bold">来店履歴</h2>
      <div className="space-y-2">
        {history.map(h => (
          <div key={h.id} className="bg-bg-white border border-border rounded-[var(--radius)] px-4 py-3">
            <div className="flex justify-between text-[12px] text-text-tertiary mb-1">{h.date}<span>{h.stay}</span></div>
            <p className="text-[15px] font-bold">¥{h.amount.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
