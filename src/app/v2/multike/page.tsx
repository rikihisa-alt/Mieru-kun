"use client";

import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { customerStore } from "@/lib/store/domain-stores";
import { PageHeader, Panel, Field, VStack, Btn, Kpis, Kpi, Empty } from "@/components/v2/ui";
import { Send } from "lucide-react";

export default function MultikePage() {
  const [customers] = usePersisted(customerStore);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState(5);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);

  function toggle(id: string) { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  function execute() {
    if (selected.size === 0 || !reason.trim()) return;
    setSent(true);
    setTimeout(() => { setSent(false); setSelected(new Set()); setReason(""); }, 2000);
  }

  return (
    <VStack gap={16}>
      <PageHeader title="マルチケ配布" sub={`対象 ${selected.size}名`} action={<Btn variant="primary" onClick={execute} disabled={!selected.size || !reason.trim() || sent}><Send size={14}/> {sent ? "配布しました" : "配布実行"}</Btn>} />

      <Kpis>
        <Kpi label="対象" value={selected.size} sub="名" />
        <Kpi label="1人あたり" value={amount} sub="枚" />
        <Kpi label="合計配布" value={(selected.size * amount).toLocaleString()} sub="枚" />
      </Kpis>

      <Panel title="配布設定">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="1人あたり枚数"><input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} /></Field>
          <Field label="配布理由" required><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="春の感謝祭キャンペーン" /></Field>
        </div>
      </Panel>

      <Panel title="対象選択">
        {customers.length === 0 ? <Empty>顧客がいません</Empty> : (
          <table className="v2-table">
            <thead><tr><th></th><th>名前</th><th>ランク</th></tr></thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td style={{ width: 30 }}><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} style={{ width: 14, height: 14 }} /></td>
                  <td>{c.nickname || c.name}{c.nickname && <span className="v2-mute" style={{ marginLeft: 6, fontSize: 11 }}>{c.name}</span>}</td>
                  <td className="v2-mute">{c.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </VStack>
  );
}
