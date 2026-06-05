"use client";

import { PageHeader, Panel, VStack, Empty } from "@/components/v2/ui";
import { useOrders, orderStore } from "@/lib/orders/store";
import { STATUS_LABEL, KIND_LABEL, CALL_REASON_LABEL, type OrderStatus } from "@/lib/orders/types";

export default function LivePage() {
  const orders = useOrders();
  const active = orders.filter(o => o.status !== "done" && o.status !== "canceled");

  return (
    <VStack gap={16}>
      <PageHeader title="ライブ注文" sub={`${active.length}件 未対応`} />
      <Panel>
        {active.length === 0 ? <Empty>ライブ注文はありません</Empty> : (
          <table className="v2-table">
            <thead><tr><th>時刻</th><th>卓・席</th><th>顧客</th><th>種別</th><th>内容</th><th>状態</th><th></th></tr></thead>
            <tbody>
              {active.map(o => (
                <tr key={o.id}>
                  <td className="v2-num v2-sub">{new Date(o.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td>{o.seat.tableNo} <span className="v2-mute">{o.seat.seatNo}</span></td>
                  <td>{o.customer.displayName}</td>
                  <td className="v2-mute">{KIND_LABEL[o.kind]}</td>
                  <td className="v2-sub" style={{ fontSize: 12 }}>
                    {o.kind === "call" ? (o.call ? CALL_REASON_LABEL[o.call.type] : "") : o.items?.map(i => `${i.name}×${i.qty}`).join(" / ")}
                  </td>
                  <td>
                    <select value={o.status} onChange={(e) => orderStore.updateStatus(o.id, e.target.value as OrderStatus)} style={{ height: 24, fontSize: 11, padding: "0 6px" }}>
                      <option value="new">{STATUS_LABEL.new}</option>
                      <option value="preparing">{STATUS_LABEL.preparing}</option>
                      <option value="served">{STATUS_LABEL.served}</option>
                      <option value="done">{STATUS_LABEL.done}</option>
                      <option value="canceled">{STATUS_LABEL.canceled}</option>
                    </select>
                  </td>
                  <td></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </VStack>
  );
}
