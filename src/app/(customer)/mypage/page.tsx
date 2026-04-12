import { Card, StatCard } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Trophy, Ticket, History } from "lucide-react";
import Link from "next/link";
import { rankLabel, rankColor } from "@/lib/utils";

export default function MyPage() {
  // デモモード: 固定データ表示
  const customer = {
    name: "田中 太郎",
    rank: "gold",
    chip_balance: 5000,
    point_balance: 1200,
    total_visits: 25,
  };

  return (
    <div className="space-y-4">
      {/* プロフィール */}
      <Card>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <span className="text-2xl font-bold text-primary">
              {customer.name.charAt(0)}
            </span>
          </div>
          <h1 className="text-lg font-bold">{customer.name}</h1>
          <Badge variant="custom" className={`mt-1 ${rankColor(customer.rank)}`}>
            {rankLabel(customer.rank)}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            来店回数: {customer.total_visits}回
          </p>
        </div>
      </Card>

      {/* 残高 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          title="チップ残高"
          value={`${customer.chip_balance.toLocaleString()}枚`}
          icon={<Coins className="w-5 h-5" />}
        />
        <StatCard
          title="ポイント"
          value={`${customer.point_balance.toLocaleString()}pt`}
          icon={<Trophy className="w-5 h-5" />}
        />
      </div>

      {/* メニュー */}
      <div className="space-y-2">
        <Link href="/mypage/history">
          <Card className="flex items-center justify-between hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">来店・利用履歴</span>
            </div>
            <span className="text-muted-foreground">→</span>
          </Card>
        </Link>
        <Link href="/mypage/coupons">
          <Card className="flex items-center justify-between hover:bg-muted/30 transition-colors mt-2">
            <div className="flex items-center gap-3">
              <Ticket className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">クーポン</span>
            </div>
            <span className="text-muted-foreground">→</span>
          </Card>
        </Link>
      </div>
    </div>
  );
}
