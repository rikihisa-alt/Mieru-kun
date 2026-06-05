"use client";

import Link from "next/link";
import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { customerStore, type CustomerRank } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Kpis, Kpi, VStack, Empty } from "@/components/v2/ui";
import { Search, Plus } from "lucide-react";

const RANK_LABEL: Record<CustomerRank, string> = { regular: "Regular", silver: "Silver", gold: "Gold", vip: "VIP" };

function normalize(s: string) {
  return s.toLowerCase().replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export default function CustomersPage() {
  const [customers] = usePersisted(customerStore);
  const [q, setQ] = useState("");

  const norm = normalize(q.trim());
  const rows = norm
    ? customers.filter(c => normalize(c.name).includes(norm) || normalize(c.nickname).includes(norm) || c.phone.includes(q))
    : customers;

  return (
    <VStack gap={16}>
      <PageHeader
        title="顧客"
        sub={`${customers.length}名`}
        action={
          <Btn variant="primary"><Link href="/v2/customers/new"><Plus size={14} /> 登録</Link></Btn>
        }
      />

      <Kpis>
        <Kpi label="登録顧客" value={customers.length} />
        <Kpi label="VIP" value={customers.filter(c => c.rank === "vip").length} />
        <Kpi label="GOLD" value={customers.filter(c => c.rank === "gold").length} />
        <Kpi label="今月来店" value={customers.filter(c => (c.lastVisit ?? "") >= "2026/04").length} />
      </Kpis>

      <div className="v2-row" style={{ gap: 12 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--v2-text-mute)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="名前・ニックネーム・電話" style={{ paddingLeft: 30 }} />
        </div>
        <span className="v2-mute" style={{ fontSize: 12, marginLeft: "auto" }}>{rows.length}件</span>
      </div>

      <div className="v2-panel">
        <table className="v2-table v2-table-clickable">
          <thead>
            <tr>
              <th>名前</th>
              <th>ランク</th>
              <th>電話</th>
              <th className="v2-num-cell">来店</th>
              <th className="v2-num-cell">累計利用</th>
              <th className="v2-num-cell">チップ</th>
              <th className="v2-num-cell">ポイント</th>
              <th>最終来店</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8}><Empty>該当する顧客がいません</Empty></td></tr>
            ) : rows.map(c => (
              <tr key={c.id} onClick={() => location.assign(`/v2/customers/${c.id}`)}>
                <td>
                  <div>{c.nickname || c.name}</div>
                  {c.nickname && <div className="v2-mute" style={{ fontSize: 11 }}>{c.name}</div>}
                </td>
                <td><span className="v2-mute" style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>{RANK_LABEL[c.rank]}</span></td>
                <td className="v2-sub">{c.phone || "—"}</td>
                <td className="v2-num-cell">{c.totalVisits}</td>
                <td className="v2-num-cell">¥{c.totalSpent.toLocaleString()}</td>
                <td className="v2-num-cell">{c.chipBalance.toLocaleString()}</td>
                <td className="v2-num-cell">{c.pointBalance.toLocaleString()}</td>
                <td className="v2-sub">{c.lastVisit ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VStack>
  );
}
