"use client";

import { useState } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { customerStore, type CustomerRank } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, Modal, VStack, HStack, Chip, Kpis, Kpi, Empty } from "@/components/v2/ui";
import { Plus, LogOut, AlertTriangle, ShieldAlert } from "lucide-react";

interface Visit {
  id: string;
  customerId: string | null;
  name: string;
  rank: CustomerRank;
  checkedInAt: string;
  tableId?: string;
  seatIndex?: number;
}
interface TableMeta { id: string; name: string }

const RANK_LABEL: Record<CustomerRank, string> = { regular: "Regular", silver: "Silver", gold: "Gold", vip: "VIP" };

export default function CheckinPage() {
  const [customers] = usePersisted(customerStore);
  const [visits, setVisits] = usePersistedState<Visit[]>("v2_visits_v1", []);
  const [tables] = usePersistedState<TableMeta[]>("v2_tables_v2", []);
  const tableNameOf = (id?: string) => id ? (tables.find(t => t.id === id)?.name ?? id) : undefined;
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestRank, setGuestRank] = useState<CustomerRank>("regular");

  const selectedCustomer = selectedId ? customers.find(x => x.id === selectedId) : undefined;
  const customerById = (id: string | null) => id ? customers.find(x => x.id === id) : undefined;

  function makeVisitId() {
    return `v${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }
  function checkin() {
    if (selectedId) {
      const c = customers.find(x => x.id === selectedId);
      if (!c) return;
      if (visits.some(v => v.customerId === c.id)) {
        alert(`${c.nickname || c.name}さんは既にチェックイン済みです`);
        return;
      }
      if (c.isBlacklisted && !confirm("本当に入店させますか?")) return;
      setVisits(prev => [{ id: makeVisitId(), customerId: c.id, name: c.nickname || c.name, rank: c.rank, checkedInAt: new Date().toISOString() }, ...prev]);
    } else {
      if (!guestName.trim()) return;
      setVisits(prev => [{ id: makeVisitId(), customerId: null, name: guestName.trim(), rank: guestRank, checkedInAt: new Date().toISOString() }, ...prev]);
    }
    setOpen(false);
    setSelectedId(""); setGuestName(""); setGuestRank("regular");
  }
  function checkout(id: string) {
    const v = visits.find(x => x.id === id);
    if (!v) return;
    if (!confirm(`${v.name}さんを退店にしますか?(滞在 ${elapsed(v.checkedInAt)})`)) return;
    setVisits(prev => prev.filter(x => x.id !== id));
  }
  function elapsed(iso: string) {
    const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 60) return `${m}分`;
    return `${Math.floor(m / 60)}時間${m % 60}分`;
  }

  return (
    <VStack gap={16}>
      <PageHeader
        title="入店"
        sub={`来店中 ${visits.length}名`}
        action={<Btn variant="primary" onClick={() => setOpen(true)}><Plus size={14} /> 入店登録</Btn>}
      />

      <Kpis>
        <Kpi label="来店中" value={visits.length} />
        <Kpi label="VIP/GOLD" value={visits.filter(v => v.rank === "vip" || v.rank === "gold").length} />
        <Kpi label="未配置" value={visits.filter(v => !v.tableId).length} />
        <Kpi label="本日来店" value={visits.length} />
      </Kpis>

      <Panel title="来店中">
        {visits.length === 0 ? <Empty>来店中のお客様はいません</Empty> : (
          <table className="v2-table">
            <thead>
              <tr><th>名前</th><th>ランク</th><th>入店時刻</th><th>経過</th><th>卓</th><th></th></tr>
            </thead>
            <tbody>
              {visits.map(v => {
                const c = customerById(v.customerId);
                return (
                <tr key={v.id}>
                  <td>
                    <HStack gap={6} style={{ alignItems: "center" }}>
                      <span>{v.name}</span>
                      {c?.isBlacklisted && (
                        <span title="⚠ ブラックリスト登録者です" style={{ display: "inline-flex" }}>
                          <ShieldAlert size={14} color="var(--v2-danger)" />
                        </span>
                      )}
                      {c?.cautionText && (
                        <span title={c.cautionText} style={{ display: "inline-flex" }}>
                          <AlertTriangle size={14} color="var(--v2-warn)" />
                        </span>
                      )}
                    </HStack>
                  </td>
                  <td className="v2-mute">{RANK_LABEL[v.rank]}</td>
                  <td className="v2-num">{new Date(v.checkedInAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td className="v2-num v2-sub">{elapsed(v.checkedInAt)}</td>
                  <td>{tableNameOf(v.tableId) ? <Chip>{tableNameOf(v.tableId)}{v.seatIndex != null && ` #${v.seatIndex + 1}`}</Chip> : <span className="v2-mute">—</span>}</td>
                  <td><Btn size="xs" onClick={() => checkout(v.id)}><LogOut size={11} /> 退店</Btn></td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="入店登録"
        footer={<><Btn onClick={() => setOpen(false)}>キャンセル</Btn><Btn variant="primary" onClick={checkin}>入店する</Btn></>}
      >
        <VStack gap={16}>
          <Field label="既存顧客から選択">
            <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setGuestName(""); }}>
              <option value="">— 新規ゲストとして登録 —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.nickname || c.name}{c.nickname && ` / ${c.name}`} ({RANK_LABEL[c.rank]})</option>
              ))}
            </select>
          </Field>
          {selectedCustomer?.isBlacklisted && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 10, background: "var(--v2-danger-bg)", color: "var(--v2-danger)", fontSize: 12, borderRadius: 3 }}>
              <ShieldAlert size={16} /> ⚠ ブラックリスト登録者です
            </div>
          )}
          {selectedCustomer?.cautionText && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: 10, background: "var(--v2-warn-bg)", color: "var(--v2-warn)", fontSize: 12, borderRadius: 3 }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> <span>{selectedCustomer.cautionText}</span>
            </div>
          )}
          {!selectedId && (
            <>
              <Field label="ゲスト名">
                <input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="お名前" />
              </Field>
              <Field label="ランク">
                <select value={guestRank} onChange={(e) => setGuestRank(e.target.value as CustomerRank)}>
                  <option value="regular">Regular</option>
                  <option value="silver">Silver</option>
                  <option value="gold">Gold</option>
                  <option value="vip">VIP</option>
                </select>
              </Field>
            </>
          )}
        </VStack>
      </Modal>
    </VStack>
  );
}
