"use client";

import { PageHeader, Panel, VStack, Btn, Field, Kpis, Kpi } from "@/components/v2/ui";
import { useState } from "react";

export default function ClosingPage() {
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  function execute() {
    if (!confirm("締め処理を実行しますか?")) return;
    setDone(true);
  }

  return (
    <VStack gap={16}>
      <PageHeader title="締め処理" sub={new Date().toISOString().slice(0, 10)} />
      <Kpis>
        <Kpi label="今日の売上" value="¥0" />
        <Kpi label="現金" value="¥0" />
        <Kpi label="カード" value="¥0" />
        <Kpi label="QR" value="¥0" />
      </Kpis>
      <Panel title="締めメモ">
        <VStack gap={12}>
          <Field label="備考"><textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
          {done ? (
            <div style={{ padding: 12, background: "var(--v2-success-bg)", color: "var(--v2-success)", borderRadius: 3, fontSize: 13 }}>本日の締め処理を完了しました</div>
          ) : (
            <Btn variant="primary" onClick={execute}>締め処理を実行</Btn>
          )}
        </VStack>
      </Panel>
    </VStack>
  );
}
