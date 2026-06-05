"use client";

import { PageHeader, Panel, VStack, Empty } from "@/components/v2/ui";

export default function HistoryPage() {
  return (
    <VStack gap={16}>
      <PageHeader title="履歴" sub="入退店・注文・精算・チップ操作の時系列" />
      <Panel>
        <Empty>履歴データはまだありません</Empty>
      </Panel>
    </VStack>
  );
}
