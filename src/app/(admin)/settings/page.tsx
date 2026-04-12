import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Store, Shield } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">設定</h1>

      <div className="max-w-2xl space-y-6">
        {/* 店舗情報 */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">店舗情報</h2>
          </div>
          <div className="space-y-4">
            <Input
              id="store_name"
              label="店舗名"
              defaultValue="Come On Casino"
            />
            <Input
              id="display_name"
              label="顧客向け表示名"
              defaultValue="Come On みえるくん"
              placeholder="店名 + みえるくん"
            />
            <Input
              id="store_address"
              label="住所"
              placeholder="東京都..."
            />
            <Input
              id="store_phone"
              label="電話番号"
              type="tel"
              placeholder="03-1234-5678"
            />
            <Button>保存する</Button>
          </div>
        </Card>

        {/* LINE連携 */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">LINE連携</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            LINE Login / Messaging API の設定は今後のバージョンで対応予定です。
          </p>
          <div className="space-y-4">
            <Input
              id="line_channel_id"
              label="LINE Channel ID"
              placeholder="未設定"
              disabled
            />
            <Input
              id="line_channel_secret"
              label="LINE Channel Secret"
              placeholder="未設定"
              disabled
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
