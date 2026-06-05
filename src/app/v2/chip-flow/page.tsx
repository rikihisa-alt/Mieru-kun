"use client";

import { PageHeader, Panel, VStack, Kpis, Kpi, Empty, Tabs } from "@/components/v2/ui";
import { useState } from "react";

export default function ChipFlowPage() {
  const [view, setView] = useState("day");

  return (
    <VStack gap={16}>
      <PageHeader title="チップフロー" sub="払出 / 回収の動き" />
      <Kpis>
        <Kpi label="期間内 払出" value="0" sub="枚" />
        <Kpi label="期間内 回収" value="0" sub="枚" />
        <Kpi label="純払出" value="0" sub="枚" />
        <Kpi label="ピーク日" value="—" />
      </Kpis>
      <Tabs value={view} onChange={setView} items={[
        { value: "day", label: "日別" },
        { value: "week", label: "週別" },
        { value: "month", label: "月別" },
        { value: "calendar", label: "カレンダー" },
      ]} />
      <Panel>
        <Empty>チップフローのデータを記録してから表示されます</Empty>
      </Panel>
    </VStack>
  );
}
