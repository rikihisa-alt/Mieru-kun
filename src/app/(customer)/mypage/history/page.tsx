import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CustomerHistoryPage() {
  // デモモード: サンプル履歴
  const history = [
    { id: "1", date: "2026/04/10", amount: 8500, stay: "3時間20分", status: "settled" },
    { id: "2", date: "2026/04/05", amount: 12000, stay: "4時間10分", status: "settled" },
    { id: "3", date: "2026/03/28", amount: 5000, stay: "2時間", status: "settled" },
  ];

  return (
    <div className="space-y-4">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />マイページに戻る
      </Link>
      <h1 className="text-lg font-bold">来店・利用履歴</h1>

      {history.length === 0 ? (
        <Card className="text-center py-8"><p className="text-sm text-muted-foreground">履歴はありません</p></Card>
      ) : (
        <div className="space-y-2">
          {history.map(h => (
            <Card key={h.id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">{h.date}</span>
                <Badge variant="info">精算済</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">滞在: {h.stay}</span>
                <span className="font-bold">¥{h.amount.toLocaleString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
