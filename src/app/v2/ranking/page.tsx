"use client";

import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { customerStore } from "@/lib/store/domain-stores";
import { PageHeader, Panel, VStack, Tabs, Empty } from "@/components/v2/ui";

type Metric = "visits" | "spent" | "chip" | "point";

export default function RankingPage() {
  const [customers] = usePersisted(customerStore);
  const [tab, setTab] = useState<Metric>("visits");

  const rankedAll = [...customers].sort((a, b) => {
    if (tab === "visits") return b.totalVisits - a.totalVisits;
    if (tab === "spent") return b.totalSpent - a.totalSpent;
    if (tab === "point") return b.pointBalance - a.pointBalance;
    return b.chipBalance - a.chipBalance;
  });
  const sorted = rankedAll.slice(0, 50);

  const unit = tab === "visits" ? "回" : tab === "spent" ? "" : tab === "point" ? "pt" : "枚";
  const fmt = (v: number) => tab === "spent" ? `¥${v.toLocaleString()}` : v.toLocaleString();

  return (
    <VStack gap={16}>
      <PageHeader
        title="ランキング"
        sub={rankedAll.length > 50 ? `上位50件を表示中 (全${rankedAll.length}名)` : rankedAll.length > 0 ? `全${rankedAll.length}名を表示中` : undefined}
      />
      <Tabs value={tab} onChange={(v) => setTab(v as Metric)} items={[
        { value: "visits", label: "来店回数" },
        { value: "spent", label: "累計利用額" },
        { value: "point", label: "獲得pt" },
        { value: "chip", label: "チップ残高" },
      ]} />
      <Panel>
        {sorted.length === 0 ? <Empty>データがありません</Empty> : (
          <table className="v2-table">
            <thead><tr><th>順位</th><th>名前</th><th>ランク</th><th className="v2-num-cell">{tab === "visits" ? "来店" : tab === "spent" ? "利用額" : tab === "point" ? "獲得pt" : "チップ"}</th></tr></thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.id}>
                  <td className="v2-num" style={{ width: 50 }}>{i + 1}</td>
                  <td>{c.nickname || c.name}</td>
                  <td className="v2-mute">{c.rank}</td>
                  <td className="v2-num-cell">{fmt(tab === "visits" ? c.totalVisits : tab === "spent" ? c.totalSpent : tab === "point" ? c.pointBalance : c.chipBalance)}{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </VStack>
  );
}
