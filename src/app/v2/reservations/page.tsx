"use client";

import { useState } from "react";
import { usePersisted } from "@/lib/persist/store";
import { reservationStore, type ReservationRecord, type ReservationStatus } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, HStack, Chip, Empty } from "@/components/v2/ui";
import { Plus, Trash2 } from "lucide-react";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "未確定", confirmed: "確定", canceled: "キャンセル", no_show: "ノーショー", arrived: "来店済",
};

export default function ReservationsPage() {
  const [resvs, setResvs] = usePersisted(reservationStore);
  const [open, setOpen] = useState(false);
  const [d, setD] = useState({ customerName: "", nickname: "", date: "", time: "19:00", party: 2, note: "", source: "phone" as ReservationRecord["source"] });

  function add() {
    if (!d.customerName.trim() || !d.date) return;
    const r: ReservationRecord = {
      id: `r${Date.now()}`,
      customerName: d.customerName, nickname: d.nickname || undefined,
      date: d.date, time: d.time, party: d.party,
      note: d.note || undefined,
      status: "pending", source: d.source,
      createdAt: new Date().toISOString(),
    };
    setResvs(prev => [r, ...prev]);
    setOpen(false);
    setD({ customerName: "", nickname: "", date: "", time: "19:00", party: 2, note: "", source: "phone" });
  }
  function setStatus(id: string, status: ReservationStatus) {
    setResvs(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }
  function remove(id: string) {
    if (!confirm("削除しますか？")) return;
    setResvs(prev => prev.filter(r => r.id !== id));
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="予約"
        sub={`${resvs.length}件`}
        action={<Btn variant="primary" onClick={() => setOpen(true)}><Plus size={14} /> 新規予約</Btn>}
      />

      <Panel>
        {resvs.length === 0 ? <Empty>予約はありません</Empty> : (
          <table className="v2-table">
            <thead><tr><th>日時</th><th>顧客</th><th>人数</th><th>経路</th><th>状態</th><th></th></tr></thead>
            <tbody>
              {resvs.map(r => (
                <tr key={r.id}>
                  <td className="v2-num">{r.date} {r.time}</td>
                  <td>{r.nickname || r.customerName}{r.nickname && <span className="v2-mute" style={{ marginLeft: 6, fontSize: 11 }}>{r.customerName}</span>}</td>
                  <td className="v2-num-cell">{r.party}</td>
                  <td className="v2-sub">{r.source}</td>
                  <td>
                    <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value as ReservationStatus)} style={{ height: 24, fontSize: 12, padding: "0 6px" }}>
                      {(Object.keys(STATUS_LABEL) as ReservationStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                    </select>
                  </td>
                  <td><Btn size="xs" variant="danger" onClick={() => remove(r.id)}><Trash2 size={11} /></Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="新規予約"
        footer={<><Btn onClick={() => setOpen(false)}>キャンセル</Btn><Btn variant="primary" onClick={add}>登録</Btn></>}
      >
        <VStack gap={16}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="顧客名" required><input value={d.customerName} onChange={(e) => setD({ ...d, customerName: e.target.value })} /></Field>
            <Field label="ニックネーム"><input value={d.nickname} onChange={(e) => setD({ ...d, nickname: e.target.value })} /></Field>
            <Field label="日付" required><input type="date" value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} /></Field>
            <Field label="時間"><input type="time" value={d.time} onChange={(e) => setD({ ...d, time: e.target.value })} /></Field>
            <Field label="人数"><input type="number" min={1} max={20} value={d.party} onChange={(e) => setD({ ...d, party: parseInt(e.target.value) || 1 })} /></Field>
            <Field label="経路">
              <select value={d.source} onChange={(e) => setD({ ...d, source: e.target.value as ReservationRecord["source"] })}>
                <option value="phone">電話</option><option value="line">LINE</option><option value="walk_in">来店</option><option value="other">その他</option>
              </select>
            </Field>
          </div>
          <Field label="備考"><textarea rows={2} value={d.note} onChange={(e) => setD({ ...d, note: e.target.value })} /></Field>
        </VStack>
      </Modal>
    </VStack>
  );
}
