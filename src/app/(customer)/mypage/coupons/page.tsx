import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Ticket } from "lucide-react";
import Link from "next/link";

export default function CustomerCouponsPage() {
  // デモモード: サンプルクーポン
  const coupons = [
    { id: "1", name: "初回来店10%OFF", discount: "10%OFF", status: "active", expires: "2026/05/31" },
    { id: "2", name: "ドリンク1杯無料", discount: "無料", status: "used", expires: "2026/04/30" },
  ];

  return (
    <div className="space-y-4">
      <Link href="/mypage" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" />マイページに戻る
      </Link>
      <h1 className="text-lg font-bold">クーポン</h1>

      {coupons.length === 0 ? (
        <Card className="text-center py-8">
          <Ticket className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">クーポンはありません</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {coupons.map(c => (
            <Card key={c.id} className={c.status !== "active" ? "opacity-60" : ""}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Ticket className="w-5 h-5 text-primary" />
                  <span className="font-medium text-sm">{c.name}</span>
                </div>
                <Badge variant={c.status === "active" ? "success" : "default"}>
                  {c.status === "active" ? "有効" : "使用済"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>割引: {c.discount}</span>
                <span>有効期限: {c.expires}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
