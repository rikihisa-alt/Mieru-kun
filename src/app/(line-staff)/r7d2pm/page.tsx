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
    <div className="ln-page">
      <div className="ln-stack-sm">
        <p className="ln-mute" style={{ fontSize: 12, margin: 0 }}>
          稼働 {tables.filter(t => t.occupied > 0).length} / {tables.length} 卓
        </p>
        <p style={{ fontSize: 10, color: "var(--ln-text-mute)", margin: 0 }}>
          ※ デモ表示(実データ連携は準備中)
        </p>

        {tables.map((t) => {
          const active = t.occupied > 0;
          return (
            <div key={t.name} className="ln-card ln-card-compact">
              <div className="ln-spread" style={{ marginBottom: 8 }}>
                <div className="ln-row">
                  <Grid3X3 size={14} style={{ color: active ? "var(--ln-accent-text)" : "var(--ln-text-mute)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</span>
                </div>
                <span className="ln-chip">{t.type}</span>
              </div>
              <div className="ln-row">
                <div style={{ display: "flex", gap: 2, flex: 1 }}>
                  {Array.from({ length: t.seats }).map((_, i) => (
                    <div
                      key={i}
                      style={{
                        height: 6, flex: 1, borderRadius: 999,
                        background: i < t.occupied ? "var(--ln-accent)" : "var(--ln-border)",
                      }}
                    />
                  ))}
                </div>
                <span className="ln-sub ln-num" style={{ fontSize: 11, fontWeight: 500 }}>{t.occupied}/{t.seats}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
