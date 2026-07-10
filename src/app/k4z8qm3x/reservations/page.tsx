"use client";

import { useState, useMemo } from "react";
import { usePersisted } from "@/lib/persist/store";
import { reservationStore, customerStore, type ReservationRecord, type ReservationStatus } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, Empty } from "@/components/v2/ui";
import { Plus, Trash2, Pencil, Search } from "lucide-react";

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "未確定", confirmed: "確定", canceled: "キャンセル", no_show: "ノーショー", arrived: "来店済",
};
// 変更に確認ダイアログを出す状態
const CONFIRM_STATUSES: ReservationStatus[] = ["canceled", "no_show"];

const emptyForm = { customerName: "", nickname: "", date: "", time: "19:00", party: 2, note: "", source: "phone" as ReservationRecord["source"] };

export default function ReservationsPage() {
  const [resvs, setResvs] = usePersisted(reservationStore);
  const [customers] = usePersisted(customerStore);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationRecord | null>(null);
  const [d, setD] = useState(emptyForm);
  const [query, setQuery] = useState("");

  // 顧客名 → 電話番号の逆引き (customerStore は名前/ニックネームに phone を持つ)
  const phoneByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of customers) {
      if (c.phone) {
        map.set(c.name, c.phone);
        if (c.nickname) map.set(c.nickname, c.phone);
      }
    }
    return map;
  }, [customers]);
  function phoneFor(r: ReservationRecord): string {
    return phoneByName.get(r.customerName) || (r.nickname ? phoneByName.get(r.nickname) : undefined) || "";
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resvs;
    return resvs.filter(r =>
      r.customerName.toLowerCase().includes(q) ||
      (r.nickname ?? "").toLowerCase().includes(q) ||
      phoneFor(r).replace(/-/g, "").includes(q.replace(/-/g, ""))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resvs, query, phoneByName]);

  function openCreate() {
    setD(emptyForm);
    setEditing(null);
    setOpen(true);
  }
  function openEdit(r: ReservationRecord) {
    setD({ customerName: r.customerName, nickname: r.nickname ?? "", date: r.date, time: r.time, party: r.party, note: r.note ?? "", source: r.source });
    setEditing(r);
    setOpen(true);
  }
  function save() {
    if (!d.customerName.trim() || !d.date) return;
    if (editing) {
      setResvs(prev => prev.map(r => r.id === editing.id ? {
        ...r,
        customerName: d.customerName, nickname: d.nickname || undefined,
        date: d.date, time: d.time, party: d.party,
        note: d.note || undefined, source: d.source,
      } : r));
    } else {
      const r: ReservationRecord = {
        id: `r${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        customerName: d.customerName, nickname: d.nickname || undefined,
        date: d.date, time: d.time, party: d.party,
        note: d.note || undefined,
        status: "pending", source: d.source,
        createdAt: new Date().toISOString(),
      };
      setResvs(prev => [r, ...prev]);
    }
    setOpen(false);
    setEditing(null);
    setD(emptyForm);
  }
  function setStatus(id: string, status: ReservationStatus) {
    if (CONFIRM_STATUSES.includes(status)) {
      const label = STATUS_LABEL[status];
      if (!confirm(`ステータスを「${label}」に変更しますか？`)) return;
    }
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
        sub={`${filtered.length}件${query ? ` / 全${resvs.length}件` : ""}`}
        action={<Btn variant="primary" onClick={openCreate}><Plus size={14} /> 新規予約</Btn>}
      />

      <div className="v2-toolbar">
        <div className="v2-toolbar__search">
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--v2-text-mute)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="名前・電話番号で検索"
            style={{ paddingLeft: 30 }}
          />
        </div>
        <span className="v2-mute" style={{ fontSize: 12, marginLeft: "auto" }}>{filtered.length}件</span>
      </div>

      <Panel>
        {filtered.length === 0 ? <Empty>{query ? "該当する予約がありません" : "予約はありません"}</Empty> : (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead><tr><th>日時</th><th>顧客</th><th>人数</th><th>経路</th><th>状態</th><th></th></tr></thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td className="v2-num">{r.date} {r.time}</td>
                    <td>{r.nickname || r.customerName}{r.nickname && <span className="v2-mute" style={{ marginLeft: 6, fontSize: 11 }}>{r.customerName}</span>}</td>
                    <td className="v2-num-cell">{r.party}</td>
                    <td className="v2-sub">{r.source}</td>
                    <td>
                      <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value as ReservationStatus)}>
                        {(Object.keys(STATUS_LABEL) as ReservationStatus[]).map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                      </select>
                    </td>
                    <td>
                      <Btn size="xs" onClick={() => openEdit(r)}><Pencil size={11} /></Btn>{" "}
                      <Btn size="xs" variant="danger" onClick={() => remove(r.id)}><Trash2 size={11} /></Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setEditing(null); }}
        title={editing ? "予約編集" : "新規予約"}
        footer={<><Btn onClick={() => { setOpen(false); setEditing(null); }}>キャンセル</Btn><Btn variant="primary" onClick={save}>{editing ? "保存" : "登録"}</Btn></>}
      >
        <VStack gap={16}>
          <div className="v2-form-grid">
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
