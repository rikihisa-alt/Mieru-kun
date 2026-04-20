import { Grid3X3 } from "lucide-react";

export default function TableViewPage() {
  const tables = [
    { name: "テーブル1", type: "トナメ", occupied: 7, seats: 9 },
    { name: "テーブル2", type: "トナメ", occupied: 5, seats: 9 },
    { name: "テーブル3", type: "サイド", occupied: 3, seats: 6 },
    { name: "テーブル4", type: "サイド", occupied: 0, seats: 6 },
    { name: "テーブル5", type: "リング", occupied: 8, seats: 10 },
  ];

  return (
    <div className="space-y-3 max-w-md mx-auto">
      <p className="text-[12px] text-text-tertiary">
        稼働 {tables.filter(t => t.occupied > 0).length} / {tables.length} 卓
      </p>

      {tables.map((t) => {
        const active = t.occupied > 0;
        return (
          <div key={t.name} className={`bg-bg-white border rounded-[var(--radius)] p-3 ${active ? "border-accent/30" : "border-border"}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Grid3X3 className={`w-3.5 h-3.5 ${active ? "text-accent" : "text-text-tertiary"}`} />
                <span className="text-[13px] font-semibold">{t.name}</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] bg-bg text-text-secondary font-medium">{t.type}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5 flex-1">
                {Array.from({ length: t.seats }).map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i < t.occupied ? "bg-accent" : "bg-border-light"}`} />
                ))}
              </div>
              <span className="text-[11px] text-text-secondary font-medium">{t.occupied}/{t.seats}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
