"use client";

import Link from "next/link";
import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { staffStore } from "@/lib/store/domain-stores";
import { staffFullName, STATUS_LABEL } from "@/lib/staff-data";
import { PageHeader, Btn, Kpis, Kpi, VStack, Chip, Empty } from "@/components/v2/ui";
import { Search, Plus, FileDown } from "lucide-react";
import { printDoc, tableHtml } from "@/lib/v2/pdf";

export default function StaffPage() {
  const [staff] = usePersisted(staffStore);
  const [q, setQ] = useState("");
  const [showRetired, setShowRetired] = useState(false);
  const norm = q.toLowerCase().trim();
  const visibleStaff = showRetired ? staff : staff.filter(s => s.status !== "retired");
  const rows = norm
    ? visibleStaff.filter(s => `${s.lastName}${s.firstName}${s.role}`.toLowerCase().includes(norm))
    : visibleStaff;

  return (
    <VStack gap={16}>
      <PageHeader
        title="従業員"
        sub={`${staff.length}名`}
        action={
          <>
            <Btn onClick={() => {
              const body = tableHtml(
                ["社員番号", "名前", "役職", "部署", "入社", "状態"],
                rows.map(s => [s.employeeNo, staffFullName(s), s.role, s.department, s.joinDate, STATUS_LABEL[s.status]]),
              );
              printDoc({ title: "従業員リスト", body, storeName: "てんぽみえるくん" });
            }}><FileDown size={14}/> PDF</Btn>
            <Btn variant="primary"><Link href="/v2/staff/new"><Plus size={14} /> 登録</Link></Btn>
          </>
        }
      />

      <Kpis>
        <Kpi label="従業員" value={staff.length} />
        <Kpi label="在籍" value={staff.filter(s => s.status === "active").length} />
        <Kpi label="休職" value={staff.filter(s => s.status === "leave").length} />
        <Kpi label="退職" value={staff.filter(s => s.status === "retired").length} />
      </Kpis>

      <div className="v2-row" style={{ gap: 12 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--v2-text-mute)" }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="名前・役割" style={{ paddingLeft: 30 }} />
        </div>
        <label className="v2-row" style={{ gap: 6, fontSize: 12, cursor: "pointer", marginLeft: "auto" }}>
          <input type="checkbox" checked={showRetired} onChange={(e) => setShowRetired(e.target.checked)} />
          退職者を表示
        </label>
        <span className="v2-mute" style={{ fontSize: 12 }}>{rows.length}件</span>
      </div>

      <div className="v2-panel">
        <table className="v2-table v2-table-clickable">
          <thead>
            <tr>
              <th>社員番号</th>
              <th>名前</th>
              <th>役職</th>
              <th>部署</th>
              <th>入社</th>
              <th>状態</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={6}><Empty>該当する従業員がいません</Empty></td></tr>
            ) : rows.map(s => (
              <tr key={s.id} onClick={() => location.assign(`/v2/staff/${s.id}`)}>
                <td className="v2-sub">{s.employeeNo}</td>
                <td>{staffFullName(s)}</td>
                <td>{s.role}</td>
                <td className="v2-sub">{s.department}</td>
                <td className="v2-sub">{s.joinDate}</td>
                <td>
                  <Chip variant={s.status === "active" ? "success" : s.status === "leave" ? "warn" : undefined}>
                    {STATUS_LABEL[s.status]}
                  </Chip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </VStack>
  );
}
