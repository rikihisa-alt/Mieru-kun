"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { usePersisted } from "@/lib/persist/store";
import { customerStore, type CustomerRecord, type CustomerRank } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Kpis, Kpi, VStack, HStack, Tabs } from "@/components/v2/ui";
import { ArrowLeft } from "lucide-react";

const RANK_LABEL: Record<CustomerRank, string> = { regular: "Regular", silver: "Silver", gold: "Gold", vip: "VIP" };

export default function CustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [customers] = usePersisted(customerStore);
  const initial = customers.find(c => c.id === id);

  const [tab, setTab] = useState<"basic" | "history" | "chip" | "memo">("basic");
  const [draft, setDraft] = useState<CustomerRecord | null>(null);
  useEffect(() => { if (initial) setDraft(initial); }, [initial?.id]); // eslint-disable-line

  if (!initial) {
    return (
      <VStack gap={16}>
        <Link href="/v2/customers" className="v2-mute v2-row" style={{ gap: 4, fontSize: 12 }}>
          <ArrowLeft size={12} />一覧へ戻る
        </Link>
        <Panel><div className="v2-mute" style={{ padding: 32, textAlign: "center" }}>該当する顧客が見つかりません</div></Panel>
      </VStack>
    );
  }

  function save() {
    if (!draft) return;
    customerStore.set(prev => prev.map(c => c.id === id ? draft : c));
  }
  function remove() {
    if (!confirm("削除しますか？")) return;
    customerStore.set(prev => prev.filter(c => c.id !== id));
    router.push("/v2/customers");
  }
  function update<K extends keyof CustomerRecord>(key: K, value: CustomerRecord[K]) {
    setDraft(prev => prev ? { ...prev, [key]: value } : prev);
  }

  if (!draft) return null;

  return (
    <VStack gap={16}>
      <Link href="/v2/customers" className="v2-mute v2-row" style={{ gap: 4, fontSize: 12 }}>
        <ArrowLeft size={12} />一覧へ戻る
      </Link>
      <PageHeader
        title={initial.nickname || initial.name}
        sub={initial.nickname ? initial.name : `${RANK_LABEL[initial.rank]} · ${initial.phone || "—"}`}
        action={
          <>
            <Btn variant="danger" onClick={remove}>削除</Btn>
            <Btn variant="primary" onClick={save}>保存</Btn>
          </>
        }
      />

      <Kpis>
        <Kpi label="来店" value={initial.totalVisits} sub="回" />
        <Kpi label="累計利用" value={`¥${initial.totalSpent.toLocaleString()}`} />
        <Kpi label="チップ" value={initial.chipBalance.toLocaleString()} />
        <Kpi label="ポイント" value={initial.pointBalance.toLocaleString()} />
      </Kpis>

      <Tabs value={tab} onChange={(v) => setTab(v as typeof tab)} items={[
        { value: "basic", label: "基本情報" },
        { value: "history", label: "来店履歴" },
        { value: "chip", label: "チップ/ポイント" },
        { value: "memo", label: "メモ" },
      ]} />

      {tab === "basic" && (
        <Panel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="本名"><input value={draft.name} onChange={(e) => update("name", e.target.value)} /></Field>
            <Field label="ニックネーム"><input value={draft.nickname} onChange={(e) => update("nickname", e.target.value)} /></Field>
            <Field label="ランク">
              <select value={draft.rank} onChange={(e) => update("rank", e.target.value as CustomerRank)}>
                <option value="regular">Regular</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="vip">VIP</option>
              </select>
            </Field>
            <Field label="生年月日"><input type="date" value={draft.dateOfBirth ?? ""} onChange={(e) => update("dateOfBirth", e.target.value || undefined)} /></Field>
            <Field label="電話番号"><input value={draft.phone} onChange={(e) => update("phone", e.target.value)} /></Field>
            <Field label="メール"><input value={draft.email ?? ""} onChange={(e) => update("email", e.target.value || undefined)} /></Field>
          </div>
        </Panel>
      )}

      {tab === "history" && (
        <Panel><div className="v2-mute" style={{ padding: 32, textAlign: "center" }}>履歴データなし</div></Panel>
      )}

      {tab === "chip" && (
        <Panel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="チップ残高"><input type="number" value={draft.chipBalance} onChange={(e) => update("chipBalance", parseInt(e.target.value) || 0)} /></Field>
            <Field label="ポイント残高"><input type="number" value={draft.pointBalance} onChange={(e) => update("pointBalance", parseInt(e.target.value) || 0)} /></Field>
          </div>
        </Panel>
      )}

      {tab === "memo" && (
        <Panel>
          <VStack gap={16}>
            <Field label="備考"><textarea rows={4} value={draft.notes ?? ""} onChange={(e) => update("notes", e.target.value)} /></Field>
            <Field label="注意事項"><textarea rows={2} value={draft.cautionText ?? ""} onChange={(e) => update("cautionText", e.target.value)} /></Field>
            <HStack gap={16}>
              <label className="v2-row" style={{ gap: 6 }}><input type="checkbox" checked={!!draft.isBlacklisted} onChange={(e) => update("isBlacklisted", e.target.checked)} style={{ width: 14, height: 14 }} /> ブラックリスト</label>
              <label className="v2-row" style={{ gap: 6 }}><input type="checkbox" checked={!!draft.isHidden} onChange={(e) => update("isHidden", e.target.checked)} style={{ width: 14, height: 14 }} /> 非表示</label>
            </HStack>
          </VStack>
        </Panel>
      )}
    </VStack>
  );
}
