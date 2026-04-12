import { Card } from "@/components/ui/card";
import { BellRing, MessageSquare, Users, Clock } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BellRing className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">通知設定</h1>
          <p className="text-sm text-muted-foreground">
            通知チャネルの設定と管理
          </p>
        </div>
      </div>

      <Card>
        <div className="text-center py-8">
          <BellRing className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-semibold text-muted-foreground">
            LINE通知・プッシュ通知の設定は今後のバージョンで対応予定です
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-3">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">LINE連携設定</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            LINE公式アカウントとの連携設定を行います。顧客へのメッセージ配信やリマインド通知に利用できます。
          </p>
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">準備中</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">セグメント配信設定</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            顧客ランクやタグに基づいたセグメント配信の設定を行います。ターゲットを絞った効果的な通知が可能です。
          </p>
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">準備中</span>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">送信予約設定</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            通知の送信タイミングを予約設定できます。営業時間外の配信や定期的なリマインドに活用できます。
          </p>
          <div className="mt-4 pt-3 border-t border-border">
            <span className="text-xs text-muted-foreground">準備中</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
