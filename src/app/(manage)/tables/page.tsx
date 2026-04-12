import { Grid3X3 } from "lucide-react";

export default function TablesPage() {
  // デモデータ: 卓一覧
  const tables = [
    { id: "1", name: "テーブル1", type: "トナメ", seats: 9, occupied: 7, dealer: "山田" },
    { id: "2", name: "テーブル2", type: "トナメ", seats: 9, occupied: 5, dealer: "鈴木" },
    { id: "3", name: "テーブル3", type: "サイド", seats: 6, occupied: 3, dealer: "佐藤" },
    { id: "4", name: "テーブル4", type: "サイド", seats: 6, occupied: 0, dealer: "—" },
    { id: "5", name: "テーブル5", type: "リング", seats: 10, occupied: 8, dealer: "高橋" },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-text-secondary">
          稼働中 <strong className="text-text-primary">{tables.filter(t => t.occupied > 0).length}</strong> / {tables.length} 卓
        </span>
        <button className="px-3 py-[7px] bg-accent text-text-inverse text-[13px] font-medium rounded-[var(--radius)] hover:bg-accent-hover transition-colors">
          卓を追加
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {tables.map((t) => {
          const isActive = t.occupied > 0;
          return (
            <div
              key={t.id}
              className={`bg-bg-white border rounded-[var(--radius-lg)] p-4 transition-colors ${
                isActive ? "border-accent/30" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Grid3X3 className={`w-4 h-4 ${isActive ? "text-accent" : "text-text-tertiary"}`} />
                  <span className="text-[13px] font-semibold">{t.name}</span>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded-[var(--radius-sm)] font-medium ${
                  t.type === "トナメ" ? "bg-accent-light text-accent" :
                  t.type === "リング" ? "bg-status-success-bg text-status-success" :
                  "bg-bg text-text-secondary"
                }`}>
                  {t.type}
                </span>
              </div>

              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-text-tertiary">人数</span>
                  <span className={`font-medium ${isActive ? "text-text-primary" : "text-text-tertiary"}`}>
                    {t.occupied} / {t.seats}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-tertiary">ディーラー</span>
                  <span className="font-medium">{t.dealer}</span>
                </div>
              </div>

              {/* 座席バー */}
              <div className="mt-3 flex gap-0.5">
                {Array.from({ length: t.seats }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${
                      i < t.occupied ? "bg-accent" : "bg-border-light"
                    }`}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
