import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

export default async function SettingsPage() {
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  // デモ用のデフォルト値
  const store = {
    name: "Come On Casino",
    display_name: "カモンカジノ",
    address: "",
    phone: "",
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* 店舗情報 */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-5">
        <h2 className="text-[13px] font-semibold text-text-primary mb-4">店舗情報</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              店舗名（システム表示）
            </label>
            <input
              type="text"
              defaultValue={store.name}
              className="text-[13px]"
              readOnly
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              店舗表示名
            </label>
            <input
              type="text"
              defaultValue={store.display_name}
              className="text-[13px]"
              readOnly
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              住所
            </label>
            <input
              type="text"
              defaultValue={store.address}
              placeholder="住所を入力"
              className="text-[13px]"
              readOnly
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              電話番号
            </label>
            <input
              type="tel"
              defaultValue={store.phone}
              placeholder="電話番号を入力"
              className="text-[13px]"
              readOnly
            />
          </div>
        </div>
      </div>

      {/* 営業時間 */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-5">
        <h2 className="text-[13px] font-semibold text-text-primary mb-4">営業時間</h2>
        <p className="text-[13px] text-text-tertiary">営業時間設定は今後のアップデートで対応予定です。</p>
      </div>

      {/* LINE連携 */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-text-tertiary" />
          <h2 className="text-[13px] font-semibold text-text-primary">LINE連携</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              LINE Channel ID
            </label>
            <input
              type="text"
              placeholder="未設定"
              className="text-[13px] bg-bg"
              disabled
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              LINE Channel Secret
            </label>
            <input
              type="text"
              placeholder="未設定"
              className="text-[13px] bg-bg"
              disabled
            />
          </div>
          <p className="text-[12px] text-text-tertiary">
            LINE連携は今後のアップデートで対応予定です。
          </p>
        </div>
      </div>
    </div>
  );
}
