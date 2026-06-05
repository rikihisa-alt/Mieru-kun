"use client";

import { PageHeader, Panel, VStack, Kpis, Kpi, Empty } from "@/components/v2/ui";

export default function ReportsPage() {
  return (
    <VStack gap={16}>
      <PageHeader title="集計レポート" />
      <Kpis>
        <Kpi label="本日売上" value="¥0" />
        <Kpi label="今月売上" value="¥0" />
        <Kpi label="日次平均" value="¥0" />
        <Kpi label="件数" value="0" />
      </Kpis>
      <Panel title="日次推移">
        <Empty>データを記録してから表示されます</Empty>
      </Panel>
    </VStack>
  );
}
