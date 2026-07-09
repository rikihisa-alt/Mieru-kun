"use client";

import { useState } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { customerStore, type CustomerRank } from "@/lib/store/domain-stores";
import { PageHeader, Panel, Field, VStack, Btn, Kpis, Kpi, Empty, FilterChips, RankBadge } from "@/components/v2/ui";
import { Send } from "lucide-react";

type TargetMode = "all" | "rank" | "individual";

interface DistributionHistory {
  id: string;
  at: string;
  targetLabel: string;
  amount: number;
  targetCount: number;
  totalAmount: number;
  reason: string;
}

const RANK_LABEL: Record<CustomerRank, string> = { regular: "レギュラー", silver: "シルバー", gold: "ゴールド", vip: "VIP" };

export default function MultikePage() {
  const [customers, setCustomers] = usePersisted(customerStore);
  const [history, setHistory] = usePersistedState<DistributionHistory[]>("v2_multike_history_v1", []);

  const [mode, setMode] = useState<TargetMode>("individual");
  const [rank, setRank] = useState<CustomerRank>("regular");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [amount, setAmount] = useState(5);
  const [reason, setReason] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  function toggle(id: string) { setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; }); }

  // 対象者ID一覧 (モードに応じて実データから算出)
  const targetIds: string[] = mode === "all"
    ? customers.map(c => c.id)
    : mode === "rank"
      ? customers.filter(c => c.rank === rank).map(c => c.id)
      : Array.from(selected);

  const targetCount = targetIds.length;
  const targetLabel = mode === "all" ? "全員" : mode === "rank" ? `${RANK_LABEL[rank]}ランク` : `個人選択 ${targetCount}名`;

  function execute() {
    if (targetCount === 0 || !reason.trim() || amount <= 0) return;
    const ok = confirm(`${targetLabel}(${targetCount}名)に1人あたり${amount}枚、合計${(targetCount * amount).toLocaleString()}枚を配布します。よろしいですか？`);
    if (!ok) return;

    const idSet = new Set(targetIds);
    setCustomers(prev => prev.map(c => idSet.has(c.id) ? { ...c, multikeBalance: (c.multikeBalance ?? 0) + amount } : c));

    const record: DistributionHistory = {
      id: `mh${Date.now()}`,
      at: new Date().toLocaleString("ja-JP"),
      targetLabel,
      amount,
      targetCount,
      totalAmount: targetCount * amount,
      reason: reason.trim(),
    };
    setHistory(prev => [record, ...prev].slice(0, 20));

    setFeedback(`${targetCount}名に${amount}枚配布しました`);
    setSelected(new Set());
    setReason("");
    setTimeout(() => setFeedback(null), 3000);
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="マルチケ配布"
        sub={`対象 ${targetCount}名`}
        action={<Btn variant="primary" onClick={execute} disabled={!targetCount || !reason.trim() || amount <= 0}><Send size={14}/> {feedback ? feedback : "配布実行"}</Btn>}
      />

      <Kpis>
        <Kpi label="対象" value={targetCount} sub="名" />
        <Kpi label="1人あたり" value={amount} sub="枚" />
        <Kpi label="合計配布" value={(targetCount * amount).toLocaleString()} sub="枚" />
      </Kpis>

      <Panel title="配布設定">
        <div className="v2-form-grid">
          <Field label="1人あたり枚数"><input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} /></Field>
          <Field label="配布理由" required><input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="春の感謝祭キャンペーン" /></Field>
        </div>
        <div className="v2-toolbar" style={{ marginTop: 12 }}>
          <FilterChips value={mode} onChange={(v) => setMode(v as TargetMode)} items={[
            { value: "all", label: `全員 (${customers.length}名)` },
            { value: "rank", label: "ランク別" },
            { value: "individual", label: "個人選択" },
          ]} />
          {mode === "rank" && (
            <select value={rank} onChange={(e) => setRank(e.target.value as CustomerRank)} style={{ marginLeft: 8, width: "auto" }}>
              {(Object.keys(RANK_LABEL) as CustomerRank[]).map(r => (
                <option key={r} value={r}>{RANK_LABEL[r]} ({customers.filter(c => c.rank === r).length}名)</option>
              ))}
            </select>
          )}
        </div>
      </Panel>

      {mode === "individual" && (
        <Panel title="対象選択">
          {customers.length === 0 ? <Empty>顧客がいません</Empty> : (
            <div className="v2-table-wrap">
              <table className="v2-table">
                <thead><tr><th></th><th>名前</th><th>ランク</th><th className="v2-num-cell">マルチケ残高</th></tr></thead>
                <tbody>
                  {customers.map(c => (
                    <tr key={c.id}>
                      <td style={{ width: 30 }}><input type="checkbox" checked={selected.has(c.id)} onChange={() => toggle(c.id)} style={{ width: 14, height: 14 }} /></td>
                      <td>{c.nickname || c.name}{c.nickname && <span className="v2-mute" style={{ marginLeft: 6, fontSize: 11 }}>{c.name}</span>}</td>
                      <td>{c.rank === "regular" ? <span className="v2-mute">{RANK_LABEL[c.rank]}</span> : <RankBadge rank={c.rank} />}</td>
                      <td className="v2-num-cell">{(c.multikeBalance ?? 0).toLocaleString()}枚</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      <Panel title={`配布履歴 (直近${history.length}件)`}>
        {history.length === 0 ? <Empty>配布履歴がありません</Empty> : (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead><tr><th>日時</th><th>対象</th><th className="v2-num-cell">1人あたり</th><th className="v2-num-cell">対象人数</th><th className="v2-num-cell">合計</th><th>理由</th></tr></thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id}>
                    <td className="v2-mute" style={{ fontSize: 12 }}>{h.at}</td>
                    <td>{h.targetLabel}</td>
                    <td className="v2-num-cell">{h.amount}枚</td>
                    <td className="v2-num-cell">{h.targetCount}名</td>
                    <td className="v2-num-cell">{h.totalAmount.toLocaleString()}枚</td>
                    <td className="v2-mute" style={{ fontSize: 12 }}>{h.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </VStack>
  );
}
