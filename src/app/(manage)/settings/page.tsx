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
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                開店時刻
              </label>
              <input type="time" defaultValue="18:00" className="text-[13px]" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
                閉店時刻
              </label>
              <input type="time" defaultValue="05:00" className="text-[13px]" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-1.5">
              定休日
            </label>
            <div className="flex gap-1.5">
              {["月","火","水","木","金","土","日"].map(d => (
                <button key={d} className={`w-9 h-9 rounded-[4px] text-[12px] font-medium border transition-colors ${
                  d === "月" ? "bg-[#1a73e8] text-white border-[#1a73e8]" : "border-[#dadce0] text-[#5f6368] hover:bg-[#f0f1f3]"
                }`}>{d}</button>
              ))}
            </div>
            <p className="text-[11px] text-text-tertiary mt-1.5">選択した曜日が定休日になります</p>
          </div>
          <button className="px-4 py-[7px] bg-[#1a73e8] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#1557b0] transition-colors">
            保存
          </button>
        </div>
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
