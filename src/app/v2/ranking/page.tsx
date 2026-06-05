"use client";

import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { customerStore } from "@/lib/store/domain-stores";
import { PageHeader, Panel, VStack, Tabs, Empty } from "@/components/v2/ui";

type Metric = "visits" | "spent" | "chip";

export default function RankingPage() {
  const [customers] = usePersisted(customerStore);
  const [tab, setTab] = useState<Metric>("visits");

  const sorted = [...customers].sort((a, b) => {
    if (tab === "visits") return b.totalVisits - a.totalVisits;
    if (tab === "spent") return b.totalSpent - a.totalSpent;
    return b.chipBalance - a.chipBalance;
  }).slice(0, 50);

  const unit = tab === "visits" ? "回" : tab === "spent" ? "" : "枚";
  const fmt = (v: number) => tab === "spent" ? `¥${v.toLocaleString()}` : v.toLocaleString();

  return (
    <VStack gap={16}>
      <PageHeader title="ランキング" />
      <Tabs value={tab} onChange={(v) => setTab(v as Metric)} items={[
        { value: "visits", label: "来店回数" },
        { value: "spent", label: "累計利用額" },
        { value: "chip", label: "チップ残高" },
      ]} />
      <Panel>
        {sorted.length === 0 ? <Empty>データがありません</Empty> : (
          <table className="v2-table">
            <thead><tr><th>順位</th><th>名前</th><th>ランク</th><th className="v2-num-cell">{tab === "visits" ? "来店" : tab === "spent" ? "利用額" : "チップ"}</th></tr></thead>
            <tbody>
              {sorted.map((c, i) => (
                <tr key={c.id}>
                  <td className="v2-num" style={{ width: 50 }}>{i + 1}</td>
                  <td>{c.nickname || c.name}</td>
                  <td className="v2-mute">{c.rank}</td>
                  <td className="v2-num-cell">{fmt(tab === "visits" ? c.totalVisits : tab === "spent" ? c.totalSpent : c.chipBalance)}{unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </VStack>
  );
}
