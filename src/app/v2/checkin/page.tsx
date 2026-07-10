"use client";

import { useState } from "react";
import Link from "next/link";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { customerStore, reservationStore, type CustomerRank, type ReservationRecord } from "@/lib/store/domain-stores";
import { grantVisitPoints } from "@/lib/v2/points";
import { PageHeader, Btn, Panel, Field, Modal, VStack, HStack, Chip, Kpis, Kpi, Empty, Banner, Toast, useToast } from "@/components/v2/ui";
import { Plus, LogOut, AlertTriangle, ShieldAlert, CalendarCheck } from "lucide-react";

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
  const [reservations, setReservations] = usePersisted(reservationStore);
  const tableNameOf = (id?: string) => id ? (tables.find(t => t.id === id)?.name ?? id) : undefined;
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [guestName, setGuestName] = useState("");
  const [guestRank, setGuestRank] = useState<CustomerRank>("regular");
  const { toast, show: showToast } = useToast(3500);
  const [ageVerified, setAgeVerified] = useState(false);
  const [pledgeSigned, setPledgeSigned] = useState(false);
  const [rulesExplained, setRulesExplained] = useState(false);
  const [pledgeNoInput, setPledgeNoInput] = useState("");
  const [pendingReservationId, setPendingReservationId] = useState<string | null>(null);

  const selectedCustomer = selectedId ? customers.find(x => x.id === selectedId) : undefined;
  const customerById = (id: string | null) => id ? customers.find(x => x.id === id) : undefined;

  // 本日の予約 (pending/confirmed のみ)
  function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  const todayReservations = reservations
    .filter(r => r.date === todayKey() && (r.status === "pending" || r.status === "confirmed"))
    .sort((a, b) => a.time.localeCompare(b.time));

  /** 予約行の「来店処理」: 顧客名で customerStore を検索(一致すれば紐付け、なければゲスト扱い)して入店モーダルを開く */
  function startReservationCheckin(r: ReservationRecord) {
    const match = customers.find(c => c.name === r.customerName || (r.nickname && c.nickname === r.nickname));
    resetChecklist();
    setPendingReservationId(r.id);
    if (match) {
      setSelectedId(match.id);
      setGuestName("");
    } else {
      setSelectedId("");
      setGuestName(r.customerName);
      setGuestRank("regular");
    }
    setOpen(true);
  }

  // 初回来店チェックが必要か(既存顧客: 来店0回 or 未チェック済み。新規ゲスト: 常に必要)
  const needsFirstVisitCheck = selectedId
    ? !!selectedCustomer && (selectedCustomer.totalVisits === 0 || !selectedCustomer.firstVisitChecked?.checkedAt)
    : true;
  const needsPledgeNo = !selectedCustomer || !selectedCustomer.pledgeNo;
  const pledgeStepOk = pledgeSigned && (!needsPledgeNo || pledgeNoInput.trim().length > 0);
  const firstVisitOk = ageVerified && pledgeStepOk && rulesExplained;
  const firstVisitBlockReason = !needsFirstVisitCheck
    ? null
    : !ageVerified ? "年齢確認が未完了です"
    : !pledgeSigned ? "誓約書への署名が未完了です"
    : needsPledgeNo && !pledgeNoInput.trim() ? "誓約書の管理番号を入力してください"
    : !rulesExplained ? "ルール説明が未完了です"
    : null;

  function resetChecklist() {
    setAgeVerified(false); setPledgeSigned(false); setRulesExplained(false); setPledgeNoInput("");
  }

  function makeVisitId() {
    return `v${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  }
  function checkin() {
    if (needsFirstVisitCheck && !firstVisitOk) return;
    if (selectedId) {
      const c = customers.find(x => x.id === selectedId);
      if (!c) return;
      if (visits.some(v => v.customerId === c.id)) {
        alert(`${c.nickname || c.name}さんは既にチェックイン済みです`);
        return;
      }
      if (c.isBlacklisted && !confirm("本当に入店させますか?")) return;
      if (needsFirstVisitCheck) {
        const nowIso = new Date().toISOString();
        customerStore.set(prev => prev.map(x => x.id === c.id ? {
          ...x,
          pledgeNo: x.pledgeNo || pledgeNoInput.trim() || x.pledgeNo,
          firstVisitChecked: { ageVerified: true, pledgeSigned: true, rulesExplained: true, checkedAt: nowIso },
        } : x));
      }
      setVisits(prev => [{ id: makeVisitId(), customerId: c.id, name: c.nickname || c.name, rank: c.rank, checkedInAt: new Date().toISOString() }, ...prev]);
      const granted = grantVisitPoints(c.id, "来店チェックイン");
      if (granted > 0) {
        showToast(`${c.nickname || c.name}さんに${granted}ptを付与しました`);
      }
    } else {
      if (!guestName.trim()) return;
      setVisits(prev => [{ id: makeVisitId(), customerId: null, name: guestName.trim(), rank: guestRank, checkedInAt: new Date().toISOString() }, ...prev]);
    }
    if (pendingReservationId) {
      setReservations(prev => prev.map(r => r.id === pendingReservationId ? { ...r, status: "arrived" } : r));
    }
    setOpen(false);
    setSelectedId(""); setGuestName(""); setGuestRank("regular"); setPendingReservationId(null); resetChecklist();
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

      {toast && <Toast message={toast.message} variant={toast.variant} />}

      {todayReservations.length > 0 && (
        <Panel title={<HStack gap={6}><CalendarCheck size={14} /> 本日の予約</HStack>}>
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead><tr><th>時刻</th><th>名前</th><th>人数</th><th></th></tr></thead>
              <tbody>
                {todayReservations.map(r => (
                  <tr key={r.id}>
                    <td className="v2-num">{r.time}</td>
                    <td>{r.nickname || r.customerName}</td>
                    <td className="v2-num">{r.party}名</td>
                    <td><Btn size="xs" variant="primary" onClick={() => startReservationCheckin(r)}>来店処理</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Kpis>
        <Kpi label="来店中" value={visits.length} />
        <Kpi label="VIP/GOLD" value={visits.filter(v => v.rank === "vip" || v.rank === "gold").length} />
        <Kpi label="未配置" value={visits.filter(v => !v.tableId).length} />
        <Kpi label="本日来店" value={visits.length} />
      </Kpis>

      <Panel title="来店中">
        {visits.length === 0 ? <Empty>来店中のお客様はいません</Empty> : (
          <div className="v2-table-wrap">
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
          </div>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => { setOpen(false); setSelectedId(""); setGuestName(""); setGuestRank("regular"); setPendingReservationId(null); resetChecklist(); }}
        title="入店登録"
        footer={
          <VStack gap={4} style={{ alignItems: "flex-end" }}>
            <HStack gap={8}>
              <Btn onClick={() => { setOpen(false); setSelectedId(""); setGuestName(""); setGuestRank("regular"); setPendingReservationId(null); resetChecklist(); }}>キャンセル</Btn>
              <Btn variant="primary" onClick={checkin} disabled={needsFirstVisitCheck && !firstVisitOk}>入店する</Btn>
            </HStack>
            {needsFirstVisitCheck && firstVisitBlockReason && (
              <span style={{ fontSize: 11, color: "var(--v2-danger)" }}>{firstVisitBlockReason}</span>
            )}
          </VStack>
        }
      >
        <VStack gap={16}>
          <Field label="既存顧客から選択">
            <select value={selectedId} onChange={(e) => { setSelectedId(e.target.value); setGuestName(""); resetChecklist(); }}>
              <option value="">— 新規ゲストとして登録 —</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.nickname || c.name}{c.nickname && ` / ${c.name}`} ({RANK_LABEL[c.rank]})</option>
              ))}
            </select>
          </Field>
          {selectedCustomer?.isBlacklisted && (
            <Banner variant="danger" icon={<ShieldAlert size={16} />}>ブラックリスト登録者です</Banner>
          )}
          {selectedCustomer?.cautionText && (
            <Banner variant="warn" icon={<AlertTriangle size={16} />}>{selectedCustomer.cautionText}</Banner>
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

          {needsFirstVisitCheck && (
            <Panel title="初回来店チェック">
              <VStack gap={12}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={ageVerified} onChange={(e) => setAgeVerified(e.target.checked)} style={{ marginTop: 2 }} />
                  <span>
                    年齢確認(身分証の確認)
                    <div style={{ fontSize: 11, color: "var(--v2-danger)", marginTop: 2 }}>※ 20歳未満の方はご入店いただけません</div>
                  </span>
                </label>

                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={pledgeSigned} onChange={(e) => setPledgeSigned(e.target.checked)} style={{ marginTop: 2 }} />
                  <span>誓約書への署名</span>
                </label>
                {selectedId && (
                  needsPledgeNo ? (
                    <Field label="誓約書 管理番号" hint="この場で管理番号を採番・入力してください。チェックイン時に顧客情報へ保存されます。">
                      <input value={pledgeNoInput} onChange={(e) => setPledgeNoInput(e.target.value)} placeholder="例: P-0001" />
                    </Field>
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--v2-text-mute)" }}>管理番号: {selectedCustomer?.pledgeNo}(登録済み)</div>
                  )
                )}

                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, cursor: "pointer" }}>
                  <input type="checkbox" checked={rulesExplained} onChange={(e) => setRulesExplained(e.target.checked)} style={{ marginTop: 2 }} />
                  <span>
                    ルール説明
                    <div style={{ fontSize: 11, color: "var(--v2-text-mute)", marginTop: 2 }}>※ 当店は現金賭博を一切行わない旨を説明済み</div>
                  </span>
                </label>

                {!selectedId && (
                  <div style={{ fontSize: 12, color: "var(--v2-text-mute)", borderTop: "1px solid var(--v2-border)", paddingTop: 10 }}>
                    顧客登録すると、この確認内容が記録として残ります。
                    {" "}
                    <Link href="/v2/customers/new" style={{ textDecoration: "underline" }}>顧客登録ページへ</Link>
                  </div>
                )}
              </VStack>
            </Panel>
          )}
        </VStack>
      </Modal>
    </VStack>
  );
}
