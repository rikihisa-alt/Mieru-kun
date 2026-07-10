"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { usePersistedState } from "@/lib/persist/store";
import { PageHeader, Btn, Field, Modal, VStack, Empty } from "@/components/v2/ui";
import { Plus, Trash2, Pencil, GripVertical, X, Move, Clock, RefreshCw, Users, ArrowDown } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { CustomerRank } from "@/lib/store/domain-stores";

// ===================== フロアマップ配置定数 =====================
/** 卓カードの目安サイズ (px)。posX/posY はこのサイズを基準にクランプする */
const TABLE_W = 440;
const TABLE_H = 250;
/** フロアコンテナの目安サイズ (px)。実サイズは ref から取得するが、初期配置の概算に使う */
const FLOOR_W = 1150;
const FLOOR_H = 800;
/** 2列グリッドでの自動初期配置 (%): インデックスに応じて重ならないよう配置する */
function autoLayoutPos(index: number): { posX: number; posY: number } {
  const cols = 2;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const maxXPct = 100 - (TABLE_W / FLOOR_W) * 100; // 卓幅を引いた右端
  const cellWPct = maxXPct; // 2列なので 0% と maxXPct% の2箇所
  const rowStepPct = (TABLE_H / FLOOR_H) * 100 * 1.25; // 行間 (卓高さの125%)
  const posX = clamp(col * cellWPct, 0, maxXPct);
  const posY = clamp(row * rowStepPct, 0, 1000); // 行が増えてもフロアは縦スクロールしないため後段でクランプ
  return { posX, posY };
}
function clamp(v: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(max, Math.max(min, v));
}

// ===================== 型定義 =====================
interface Visit {
  id: string;
  customerId: string | null;
  name: string;
  rank: CustomerRank;
  checkedInAt: string;
  tableId?: string;
  seatIndex?: number;
}
interface TableDef {
  id: string;
  name: string;
  type: "トナメ" | "リング" | "サイド" | "BJ" | "バカラ";
  maxSeats: number;
  dealer?: string;
  /** ディーラー持ち時間(分) */
  dealerDurationMin?: number;
  /** ディーラーが設置されたISO時刻 (タイマー基準) */
  dealerStartedAt?: string;
  /** フロアマップ上の位置 (%, 0〜100)。未設定の卓は自動でグリッド配置される */
  posX?: number;
  posY?: number;
}

/** ウェイティングリストの希望ゲーム種別 ("指定なし" を含む) */
type WaitGame = TableDef["type"] | "指定なし";
/** ウェイティングリストの状態: 待機中 → 呼出済み → 案内済み(削除して履歴に残す) */
type WaitStatus = "waiting" | "called";
interface WaitEntry {
  id: string;
  name: string;
  partySize: number;
  game: WaitGame;
  registeredAt: string;
  status: WaitStatus;
  calledAt?: string;
  /** 未着席客リストから登録した場合の visit.id (参考用、必須ではない) */
  visitId?: string;
}

const RANK_COLOR: Record<CustomerRank, string> = {
  vip: "var(--v2-rank-vip)", gold: "var(--v2-rank-gold)", silver: "var(--v2-rank-silver)", regular: "var(--v2-rank-regular)",
};
const RANK_LABEL: Record<CustomerRank, string> = {
  vip: "VIP", gold: "Gold", silver: "Silver", regular: "",
};
const TYPE_COLOR: Record<TableDef["type"], string> = {
  "トナメ": "#2c9b6a", "リング": "#0e7a55", "サイド": "#6b7280", "BJ": "#1e293b", "バカラ": "#8b5cf6",
};
const WAIT_GAME_OPTIONS: WaitGame[] = ["トナメ", "リング", "サイド", "BJ", "バカラ", "指定なし"];
const WAIT_GAME_COLOR: Record<WaitGame, string> = {
  ...TYPE_COLOR,
  "指定なし": "#9ca3af",
};
/** 呼出済みからの経過分がこれ以上で警告色 (来ない客の可能性) */
const CALLED_WARN_MIN = 5;

// ===== 全角→半角数字変換 + 数字以外を除去 =====
function toHalfWidthDigits(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^\d]/g, "");
}

// ===================== ページ =====================
export default function TablesPage() {
  const [tables, setTables] = usePersistedState<TableDef[]>("v2_tables_v2", []);
  const [visits, setVisits] = usePersistedState<Visit[]>("v2_visits_v1", []);
  // ディーラー欄: 待機ディーラーの順番待ち列(先頭が次に入る人)
  const [dealerRun, setDealerRun] = usePersistedState<string[]>("v2_dealer_run_v1", []);
  // ウェイティングリスト: 満卓時のリング待ち順 (先頭が次の案内)
  const [waitlist, setWaitlist] = usePersistedState<WaitEntry[]>("v2_waitlist_v1", []);
  // 待機エリアから登録するときの初期名 (MoveModal から遷移)
  const [waitlistPrefill, setWaitlistPrefill] = useState<{ name: string; visitId?: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [editTable, setEditTable] = useState<TableDef | null>(null);
  const [draft, setDraft] = useState<Omit<TableDef, "id">>({ name: "", type: "トナメ", maxSeats: 6, dealer: "", dealerDurationMin: 60 });
  // 席数入力用の文字列バッファ (全角入力や 0 始まりを許容)
  const [draftSeatsStr, setDraftSeatsStr] = useState("6");
  const [editSeatsStr, setEditSeatsStr] = useState("");
  const [editDurationStr, setEditDurationStr] = useState("");
  const [draftDurationStr, setDraftDurationStr] = useState("60");

  // 顧客の席移動メニュー
  const [moveTarget, setMoveTarget] = useState<Visit | null>(null);
  // ディーラー交代モーダル対象
  const [dealerChangeTarget, setDealerChangeTarget] = useState<TableDef | null>(null);
  // 空席クリック → 待機客を選んで配置
  const [seatPick, setSeatPick] = useState<{ table: TableDef; seatIndex: number } | null>(null);

  // フロアマップ (自由配置コンテナ) の実サイズ取得用
  const floorRef = useRef<HTMLDivElement | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const waiting = useMemo(() => visits.filter(v => !v.tableId), [visits]);
  const seated = useMemo(() => visits.filter(v => v.tableId), [visits]);
  const activeVisit = activeId ? visits.find(v => v.id === activeId) : null;
  const activeTableId = activeId?.startsWith("table:") ? activeId.slice(6) : null;

  // 各卓の空席数 (卓管理見出し・ウェイティングパネルの連動表示に使用)
  const openSeatsByTable = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tables) {
      const occupied = visits.filter(v => v.tableId === t.id).length;
      map.set(t.id, Math.max(0, t.maxSeats - occupied));
    }
    return map;
  }, [tables, visits]);
  const totalOpenSeats = useMemo(
    () => Array.from(openSeatsByTable.values()).reduce((a, b) => a + b, 0),
    [openSeatsByTable]
  );
  // 希望ゲームに空席がある卓が存在するか (指定なしは任意の卓の空席で可)
  const gameHasOpenSeat = useMemo(() => {
    const map = new Map<WaitGame, boolean>();
    for (const g of WAIT_GAME_OPTIONS) {
      if (g === "指定なし") {
        map.set(g, totalOpenSeats > 0);
        continue;
      }
      const ok = tables.some(t => t.type === g && (openSeatsByTable.get(t.id) ?? 0) > 0);
      map.set(g, ok);
    }
    return map;
  }, [tables, openSeatsByTable, totalOpenSeats]);
  // 待機中(waiting/called)の先頭で、希望ゲームに空席があれば「案内可」対象
  const readyWaitlistId = useMemo(() => {
    const first = waitlist.find(w => w.status === "waiting" || w.status === "called");
    if (!first) return null;
    return gameHasOpenSeat.get(first.game) ? first.id : null;
  }, [waitlist, gameHasOpenSeat]);

  // 既存データに pos が無い卓は、自動で重ならない初期位置を割り当てて保存する
  useEffect(() => {
    if (tables.some(t => t.posX == null || t.posY == null)) {
      setTables(prev => prev.map((t, i) => {
        if (t.posX != null && t.posY != null) return t;
        const { posX, posY } = autoLayoutPos(i);
        return { ...t, posX, posY };
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables]);

  // ===== drag handlers =====
  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const activeId = String(e.active.id);

    // ===== 卓自体のドラッグ: フロア内の自由移動 (delta を % に換算) =====
    if (activeId.startsWith("table:")) {
      const tableId = activeId.slice(6);
      const floorEl = floorRef.current;
      if (!floorEl) return;
      const rect = floorEl.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const deltaXPct = (e.delta.x / rect.width) * 100;
      const deltaYPct = (e.delta.y / rect.height) * 100;
      const maxXPct = 100 - (TABLE_W / rect.width) * 100;
      const maxYPct = 100 - (TABLE_H / rect.height) * 100;
      setTables(prev => prev.map(t => {
        if (t.id !== tableId) return t;
        const base = t.posX != null && t.posY != null ? t : { ...t, ...autoLayoutPos(prev.findIndex(x => x.id === t.id)) };
        const posX = clamp((base.posX ?? 0) + deltaXPct, 0, Math.max(0, maxXPct));
        const posY = clamp((base.posY ?? 0) + deltaYPct, 0, Math.max(0, maxYPct));
        return { ...t, posX, posY };
      }));
      return;
    }

    if (!e.over) return;
    const overId = String(e.over.id);

    // ===== 顧客のドラッグ =====
    const visit = visits.find(v => v.id === activeId);
    if (!visit) return;

    // 待機エリアへ
    if (overId === "waiting") {
      setVisits(prev => prev.map(v => v.id === activeId ? { ...v, tableId: undefined, seatIndex: undefined } : v));
      return;
    }
    // 席へドロップ: "seat:{tableId}:{seatIndex}"
    if (overId.startsWith("seat:")) {
      const [, tableId, seatStr] = overId.split(":");
      const seatIndex = parseInt(seatStr, 10);
      const tbl = tables.find(t => t.id === tableId);
      if (!tbl) return;
      // 既にその席にいる人がいたら入れ替え (swap)
      const occupant = visits.find(v => v.tableId === tableId && v.seatIndex === seatIndex && v.id !== activeId);
      setVisits(prev => prev.map(v => {
        if (v.id === activeId) return { ...v, tableId, seatIndex };
        if (occupant && v.id === occupant.id) {
          return { ...v, tableId: visit.tableId, seatIndex: visit.seatIndex };
        }
        return v;
      }));
      return;
    }
    // 卓本体にドロップ: "table-drop:{tableId}" (空席へ自動配置)
    if (overId.startsWith("table-drop:")) {
      const tableId = overId.slice(11);
      const tbl = tables.find(t => t.id === tableId);
      if (!tbl) return;
      const used = new Set(visits.filter(v => v.tableId === tableId && v.id !== activeId).map(v => v.seatIndex));
      let seat = 0;
      while (used.has(seat) && seat < tbl.maxSeats) seat++;
      if (seat >= tbl.maxSeats) return;
      setVisits(prev => prev.map(v => v.id === activeId ? { ...v, tableId, seatIndex: seat } : v));
      return;
    }
  }

  // ===== 卓CRUD =====
  function openAddModal() {
    setDraft({ name: "", type: "トナメ", maxSeats: 6, dealer: "", dealerDurationMin: 60 });
    setDraftSeatsStr("6");
    setDraftDurationStr("60");
    setOpenAdd(true);
  }
  function addTable() {
    const seats = parseInt(draftSeatsStr, 10);
    const duration = parseInt(draftDurationStr, 10);
    if (!draft.name.trim()) { alert("卓名を入力してください"); return; }
    if (!seats || seats < 1) { alert("席数は1以上で入力してください"); return; }
    const dealerName = (draft.dealer ?? "").trim();
    setTables(prev => [...prev, {
      id: `t${Date.now()}`,
      ...draft,
      maxSeats: seats,
      dealerDurationMin: duration > 0 ? duration : undefined,
      dealer: dealerName || undefined,
      dealerStartedAt: dealerName ? new Date().toISOString() : undefined,
    }]);
    setOpenAdd(false);
  }
  function openEdit(t: TableDef) {
    setEditTable(t);
    setEditSeatsStr(String(t.maxSeats));
    setEditDurationStr(t.dealerDurationMin != null ? String(t.dealerDurationMin) : "60");
  }
  function saveEdit() {
    if (!editTable) return;
    const seats = parseInt(editSeatsStr, 10);
    const duration = parseInt(editDurationStr, 10);
    if (!editTable.name.trim()) { alert("卓名を入力してください"); return; }
    if (!seats || seats < 1) { alert("席数は1以上で入力してください"); return; }
    const newDealer = (editTable.dealer ?? "").trim();
    setTables(prev => prev.map(t => {
      if (t.id !== editTable.id) return t;
      // ディーラーが新規 or 変更されたらタイマーリセット
      const dealerChanged = (t.dealer ?? "") !== newDealer;
      return {
        ...editTable,
        maxSeats: seats,
        dealer: newDealer || undefined,
        dealerDurationMin: duration > 0 ? duration : undefined,
        dealerStartedAt: newDealer ? (dealerChanged ? new Date().toISOString() : t.dealerStartedAt) : undefined,
      };
    }));
    setEditTable(null);
  }
  function removeTable(id: string) {
    const seatedCount = visits.filter(v => v.tableId === id).length;
    const message = seatedCount > 0
      ? `この卓を削除します。\n配置中の${seatedCount}名は「未着席」エリアに戻ります。\n\n続行しますか？`
      : "この卓を削除しますか？";
    if (!confirm(message)) return;
    // 着席中の顧客を未着席へ戻す
    setVisits(prev => prev.map(v => v.tableId === id ? { ...v, tableId: undefined, seatIndex: undefined } : v));
    setTables(prev => prev.filter(t => t.id !== id));
  }

  // ===== ディーラー交代 =====
  /**
   * 卓のディーラーを交代する。
   * - newName が "" のときは「ディーラーなし」状態に
   * - 旧ディーラー名は (空でなければ) run の末尾に追加 (重複排除)
   * - newName が run にあれば取り除く
   * - タイマーをリセット (now)
   */
  function changeDealer(tableId: string, newName: string) {
    const trimmed = newName.trim();
    const tbl = tables.find(t => t.id === tableId);
    if (!tbl) return;
    const oldName = (tbl.dealer ?? "").trim();
    setTables(prev => prev.map(t => t.id === tableId ? {
      ...t,
      dealer: trimmed || undefined,
      dealerStartedAt: trimmed ? new Date().toISOString() : undefined,
    } : t));
    setDealerRun(prev => {
      let next = prev.filter(n => n !== trimmed); // 新ディーラーは run から除外
      if (oldName && oldName !== trimmed) {
        // 旧ディーラーを末尾へ (重複防止)
        next = next.filter(n => n !== oldName);
        next.push(oldName);
      }
      return next;
    });
    setDealerChangeTarget(null);
  }

  /** run の先頭(次のディーラー)で即交代 */
  function rotateDealer(tableId: string) {
    const next = dealerRun[0];
    if (!next) {
      alert("ディーラー欄に次のディーラーがいません。\n下部の「ディーラー欄」から追加してください。");
      return;
    }
    changeDealer(tableId, next);
  }

  // ===== ディーラー欄管理 =====
  function addToRun(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setDealerRun(prev => prev.includes(trimmed) ? prev : [...prev, trimmed]);
  }
  function removeFromRun(name: string) {
    setDealerRun(prev => prev.filter(n => n !== name));
  }
  function moveInRun(name: string, dir: -1 | 1) {
    setDealerRun(prev => {
      const i = prev.indexOf(name);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  // ===== ウェイティングリスト管理 =====
  function addToWaitlist(entry: { name: string; partySize: number; game: WaitGame; visitId?: string }) {
    const trimmed = entry.name.trim();
    if (!trimmed) return;
    setWaitlist(prev => [...prev, {
      id: `w${Date.now()}`,
      name: trimmed,
      partySize: entry.partySize,
      game: entry.game,
      registeredAt: new Date().toISOString(),
      status: "waiting",
      visitId: entry.visitId,
    }]);
    setWaitlistPrefill(null);
  }
  function callWaitlist(id: string) {
    setWaitlist(prev => prev.map(w => w.id === id ? { ...w, status: "called", calledAt: new Date().toISOString() } : w));
  }
  /** 呼出済みの人を「案内済み」としてリストから外す (=着席へ進んだので削除、簡易的に履歴は残さない) */
  function completeWaitlist(id: string) {
    setWaitlist(prev => prev.filter(w => w.id !== id));
  }
  function cancelWaitlist(id: string) {
    setWaitlist(prev => prev.filter(w => w.id !== id));
  }
  function moveInWaitlist(id: string, dir: -1 | 1) {
    setWaitlist(prev => {
      const i = prev.findIndex(w => w.id === id);
      if (i < 0) return prev;
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  // ===== 顧客の席移動 (メニュー経由) =====
  // 移動先に先客がいる場合は入れ替え (移動者の元の場所へ。元が未着席なら先客も未着席へ)
  function moveVisitTo(visitId: string, tableId: string | null, seatIndex?: number) {
    setVisits(prev => {
      const mover = prev.find(v => v.id === visitId);
      if (!mover) return prev;
      if (tableId == null) {
        return prev.map(v => v.id === visitId ? { ...v, tableId: undefined, seatIndex: undefined } : v);
      }
      const occupant = prev.find(v => v.tableId === tableId && v.seatIndex === seatIndex && v.id !== visitId);
      return prev.map(v => {
        if (v.id === visitId) return { ...v, tableId, seatIndex };
        if (occupant && v.id === occupant.id) {
          return { ...v, tableId: mover.tableId, seatIndex: mover.tableId != null ? mover.seatIndex : undefined };
        }
        return v;
      });
    });
    setMoveTarget(null);
    setSeatPick(null);
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <VStack gap={16}>
        <PageHeader
          title="卓管理"
          sub={`${tables.length}卓 · 待機 ${waiting.length}名 · 着席 ${seated.length}名 · ウェイティング ${waitlist.length}組`}
          action={<Btn variant="primary" onClick={openAddModal}><Plus size={14}/> 卓を追加</Btn>}
        />

        {/* ===== 待機エリア (一番上, 未着席のお客様) ===== */}
        <WaitingArea visits={waiting} onClickVisit={(v) => setMoveTarget(v)} />

        {/* ===== ディーラー欄 (待機列) ===== */}
        <DealerRunPanel
          run={dealerRun}
          onAdd={addToRun}
          onRemove={removeFromRun}
          onMove={moveInRun}
        />

        {/* ===== ウェイティングリスト (満卓時のリング待ち順) ===== */}
        <WaitlistPanel
          waitlist={waitlist}
          waiting={waiting}
          totalOpenSeats={totalOpenSeats}
          readyWaitlistId={readyWaitlistId}
          prefill={waitlistPrefill}
          onConsumePrefill={() => setWaitlistPrefill(null)}
          onAdd={addToWaitlist}
          onCall={callWaitlist}
          onComplete={completeWaitlist}
          onCancel={cancelWaitlist}
          onMove={moveInWaitlist}
        />

        {/* ===== フロアマップ ===== */}
        {tables.length === 0 ? (
          <div className="v2-panel"><div className="v2-panel-body"><Empty>卓が登録されていません。「卓を追加」から登録してください。</Empty></div></div>
        ) : (
          <div className="v2-table-wrap" style={{ borderRadius: "var(--v2-radius-lg)", overflowY: "auto" }}>
            <div
              ref={floorRef}
              style={{
                position: "relative",
                minWidth: 1150,
                height: 800,
                background: "var(--v2-bg)",
                boxShadow: "var(--v2-shadow-md)",
                borderRadius: "var(--v2-radius-lg)",
                backgroundImage: "radial-gradient(circle, rgba(28,46,36,0.06) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            >
              {tables.map((t, i) => {
                const pos = t.posX != null && t.posY != null ? t : { ...t, ...autoLayoutPos(i) };
                return (
                  <PokerTable
                    key={t.id}
                    table={pos}
                    seated={visits.filter(v => v.tableId === t.id)}
                    isDragging={activeTableId === t.id}
                    onEdit={() => openEdit(t)}
                    onDelete={() => removeTable(t.id)}
                    onClickVisit={(v) => setMoveTarget(v)}
                    onClickEmptySeat={(seatIndex) => setSeatPick({ table: t, seatIndex })}
                    onClickDealer={() => setDealerChangeTarget(t)}
                    onRotateDealer={() => rotateDealer(t.id)}
                    nextDealer={dealerRun[0]}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ===== オーバーレイ (顧客チップのみ。卓はその場で transform 追従) ===== */}
        <DragOverlay>
          {activeVisit && <VisitChip visit={activeVisit} dragging />}
        </DragOverlay>

        {/* ===== モーダル: 新規追加 ===== */}
        <Modal
          open={openAdd}
          onClose={() => setOpenAdd(false)}
          title="卓を追加"
          footer={<><Btn onClick={() => setOpenAdd(false)}>キャンセル</Btn><Btn variant="primary" onClick={addTable}>追加</Btn></>}
        >
          <VStack gap={16}>
            <Field label="卓名" required>
              <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="テーブル1 / A-1 など" />
            </Field>
            <Field label="種別">
              <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as TableDef["type"] })}>
                <option>トナメ</option><option>リング</option><option>サイド</option><option>BJ</option><option>バカラ</option>
              </select>
            </Field>
            <Field label="席数">
              <input
                type="text"
                inputMode="numeric"
                value={draftSeatsStr}
                onChange={(e) => setDraftSeatsStr(toHalfWidthDigits(e.target.value))}
                onFocus={(e) => e.target.select()}
                placeholder="例: 9"
              />
            </Field>
            <Field label="ディーラー">
              <input value={draft.dealer ?? ""} onChange={(e) => setDraft({ ...draft, dealer: e.target.value })} placeholder="ディーラー名(任意)" list="v2-dealer-run-options" />
            </Field>
            <Field label="ディーラー持ち時間(分)">
              <input
                type="text"
                inputMode="numeric"
                value={draftDurationStr}
                onChange={(e) => setDraftDurationStr(toHalfWidthDigits(e.target.value))}
                onFocus={(e) => e.target.select()}
                placeholder="例: 60"
              />
            </Field>
          </VStack>
        </Modal>

        {/* ===== モーダル: 編集 ===== */}
        {editTable && (
          <Modal
            open={!!editTable}
            onClose={() => setEditTable(null)}
            title="卓を編集"
            footer={<><Btn onClick={() => setEditTable(null)}>キャンセル</Btn><Btn variant="primary" onClick={saveEdit}>保存</Btn></>}
          >
            <VStack gap={16}>
              <Field label="卓名" required>
                <input value={editTable.name} onChange={(e) => setEditTable({ ...editTable, name: e.target.value })} />
              </Field>
              <Field label="種別">
                <select value={editTable.type} onChange={(e) => setEditTable({ ...editTable, type: e.target.value as TableDef["type"] })}>
                  <option>トナメ</option><option>リング</option><option>サイド</option><option>BJ</option><option>バカラ</option>
                </select>
              </Field>
              <Field label="席数">
                <input
                  type="text"
                  inputMode="numeric"
                  value={editSeatsStr}
                  onChange={(e) => setEditSeatsStr(toHalfWidthDigits(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="例: 9"
                />
              </Field>
              <Field label="ディーラー">
                <input value={editTable.dealer ?? ""} onChange={(e) => setEditTable({ ...editTable, dealer: e.target.value })} placeholder="名前を変更するとタイマーがリセットされます" list="v2-dealer-run-options" />
              </Field>
              <Field label="ディーラー持ち時間(分)">
                <input
                  type="text"
                  inputMode="numeric"
                  value={editDurationStr}
                  onChange={(e) => setEditDurationStr(toHalfWidthDigits(e.target.value))}
                  onFocus={(e) => e.target.select()}
                  placeholder="例: 60"
                />
              </Field>
            </VStack>
          </Modal>
        )}

        {/* ===== モーダル: 顧客の席移動 ===== */}
        {moveTarget && (
          <MoveModal
            visit={moveTarget}
            tables={tables}
            visits={visits}
            alreadyWaitlisted={waitlist.some(w => w.visitId === moveTarget.id)}
            onClose={() => setMoveTarget(null)}
            onMove={moveVisitTo}
            onAddToWaitlist={() => {
              setWaitlistPrefill({ name: moveTarget.name, visitId: moveTarget.id });
              setMoveTarget(null);
            }}
          />
        )}

        {/* ===== モーダル: 空席へ待機客を配置 ===== */}
        {seatPick && (
          <SeatPickModal
            table={seatPick.table}
            seatIndex={seatPick.seatIndex}
            waiting={waiting}
            onClose={() => setSeatPick(null)}
            onPick={(visitId) => moveVisitTo(visitId, seatPick.table.id, seatPick.seatIndex)}
          />
        )}

        {/* ===== モーダル: ディーラー交代 ===== */}
        {dealerChangeTarget && (
          <DealerChangeModal
            table={dealerChangeTarget}
            run={dealerRun}
            onClose={() => setDealerChangeTarget(null)}
            onChange={(name) => changeDealer(dealerChangeTarget.id, name)}
          />
        )}
        {/* ディーラー入力の候補 (ディーラー欄の待機者) */}
        <datalist id="v2-dealer-run-options">
          {dealerRun.map((name) => <option key={name} value={name} />)}
        </datalist>
      </VStack>
    </DndContext>
  );
}

// ===================== 待機エリア =====================
function WaitingArea({ visits, onClickVisit }: { visits: Visit[]; onClickVisit: (v: Visit) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: "waiting" });
  return (
    <div
      ref={setNodeRef}
      style={{
        padding: "12px 16px",
        borderRadius: "var(--v2-radius-lg)",
        background: isOver ? "var(--v2-accent-soft)" : "var(--v2-bg)",
        border: isOver ? `2px dashed var(--v2-accent)` : "1px solid transparent",
        boxShadow: "var(--v2-shadow-md)",
        transition: "background 0.15s, border-color 0.15s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: visits.length > 0 ? 10 : 0 }}>
        <span className="v2-label" style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 11, fontWeight: 600, color: "var(--v2-text-mute)" }}>
          未着席
        </span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--v2-accent-text)" }}>{visits.length}名</span>
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--v2-text-mute)" }}>
          クリックで移動 / ドラッグで配置
        </span>
      </div>
      {visits.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--v2-text-mute)" }}>
          待機中のお客様はいません (入店登録から自動で表示されます)
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {visits.map(v => <DraggableVisit key={v.id} visit={v} onClick={() => onClickVisit(v)} />)}
        </div>
      )}
    </div>
  );
}

// ===================== ドラッグ可能な顧客チップ =====================
function DraggableVisit({ visit, onClick }: { visit: Visit; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: visit.id });
  const checkedIn = new Date(visit.checkedInAt);
  const checkedInLabel = isNaN(checkedIn.getTime())
    ? ""
    : ` (入店 ${checkedIn.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })})`;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      title={`${visit.name}${checkedInLabel} — クリックで移動メニュー`}
      onClick={(e) => {
        // ドラッグでないクリックのみメニューを開く
        if (!isDragging && onClick) {
          e.stopPropagation();
          onClick();
        }
      }}
      style={{ opacity: isDragging ? 0.3 : 1, touchAction: "none", cursor: onClick ? "pointer" : "grab" }}
    >
      <VisitChip visit={visit} />
    </div>
  );
}

function VisitChip({ visit, dragging }: { visit: Visit; dragging?: boolean }) {
  const initial = visit.name.charAt(0);
  return (
    <div
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        padding: "4px 10px 4px 4px",
        background: dragging ? "var(--v2-accent-soft)" : "var(--v2-bg)",
        border: dragging ? `1px solid var(--v2-accent)` : "1px solid var(--v2-border)",
        borderRadius: 999,
        fontSize: 12, fontWeight: 500,
        boxShadow: dragging ? "var(--v2-shadow-lg)" : "var(--v2-shadow-sm)",
        userSelect: "none",
      }}
    >
      <span style={{
        width: 22, height: 22, borderRadius: 999,
        background: RANK_COLOR[visit.rank], color: "var(--v2-bg)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 10, fontWeight: 700,
      }}>{initial}</span>
      <span>{visit.name}</span>
      {RANK_LABEL[visit.rank] && (
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.04em",
          padding: "1px 6px", borderRadius: 4,
          background: "var(--v2-bg-alt)", color: "var(--v2-text-sub)",
        }}>{RANK_LABEL[visit.rank]}</span>
      )}
    </div>
  );
}

/**
 * 席数から長方形の周囲を回る座標(%, 卓の左上を0,0とした相対位置)を算出する。
 * 上辺・下辺に均等に振り分け、9席以上は左右の短辺にも1席ずつ配置する。
 * 厳密な等間隔でなくても見た目が自然であればよい。
 */
function rectSeatPositions(count: number): { cx: number; cy: number }[] {
  if (count <= 0) return [];
  const useSides = count >= 9;
  const sideSeats = useSides ? 2 : 0; // 左右に1席ずつ
  const topBottomSeats = count - sideSeats;
  const topCount = Math.ceil(topBottomSeats / 2);
  const bottomCount = topBottomSeats - topCount;

  const positions: { cx: number; cy: number }[] = [];
  // 上辺
  for (let i = 0; i < topCount; i++) {
    const t = topCount === 1 ? 0.5 : (i + 1) / (topCount + 1);
    positions.push({ cx: 8 + t * 84, cy: 0 });
  }
  // 右辺 (使う場合)
  if (useSides) positions.push({ cx: 100, cy: 50 });
  // 下辺
  for (let i = 0; i < bottomCount; i++) {
    const t = bottomCount === 1 ? 0.5 : (i + 1) / (bottomCount + 1);
    positions.push({ cx: 8 + t * 84, cy: 100 });
  }
  // 左辺 (使う場合)
  if (useSides) positions.push({ cx: 0, cy: 50 });

  return positions;
}

// ===================== 卓: 角丸長方形 (フロア上に自由配置) =====================
function PokerTable({ table, seated, onEdit, onDelete, onClickVisit, onClickEmptySeat, onClickDealer, onRotateDealer, nextDealer, isDragging }: {
  table: TableDef;
  seated: Visit[];
  isDragging?: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClickVisit: (v: Visit) => void;
  onClickEmptySeat: (seatIndex: number) => void;
  onClickDealer: () => void;
  onRotateDealer: () => void;
  nextDealer?: string;
}) {
  const { setNodeRef: setDropRef, isOver: isOverTable } = useDroppable({ id: `table-drop:${table.id}` });
  const dragHandle = useDraggable({ id: `table:${table.id}` });

  const occupancy = seated.length / table.maxSeats;
  const big = table.maxSeats > 8;
  const width = big ? TABLE_W + 60 : TABLE_W;
  const height = big ? TABLE_H + 40 : TABLE_H;
  const seatPositions = rectSeatPositions(table.maxSeats);

  const posX = table.posX ?? 0;
  const posY = table.posY ?? 0;
  const dragTransform = dragHandle.transform
    ? `translate3d(${dragHandle.transform.x}px, ${dragHandle.transform.y}px, 0)`
    : undefined;

  return (
    <div
      style={{
        position: "absolute",
        left: `${posX}%`,
        top: `${posY}%`,
        width,
        zIndex: dragHandle.isDragging ? 20 : 1,
        transform: dragTransform,
      }}
    >
      <div
        ref={setDropRef}
        style={{
          opacity: isDragging ? 0.5 : 1,
          background: "var(--v2-bg)",
          borderRadius: "var(--v2-radius-lg)",
          boxShadow: "var(--v2-shadow-md)",
          overflow: "hidden",
        }}
      >
        {/* ===== コンパクトヘッダー ===== */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 10px",
          borderBottom: "1px solid var(--v2-border)",
          flexWrap: "wrap",
        }}>
          {/* ドラッグハンドル (フロア内を自由移動) */}
          <button
            ref={dragHandle.setNodeRef}
            {...dragHandle.listeners}
            {...dragHandle.attributes}
            style={{
              cursor: "grab", padding: 4, color: "var(--v2-text-mute)",
              background: "transparent", border: 0, touchAction: "none", flexShrink: 0,
            }}
            title="ドラッグでフロア内を移動"
          >
            <GripVertical size={14} />
          </button>
          <strong style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>{table.name}</strong>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
            background: `${TYPE_COLOR[table.type]}1a`, color: TYPE_COLOR[table.type], flexShrink: 0,
          }}>{table.type}</span>
          <span style={{
            fontSize: 12, fontWeight: 600, flexShrink: 0,
            color: occupancy >= 1 ? "var(--v2-danger)" : occupancy >= 0.7 ? "var(--v2-warn)" : seated.length > 0 ? "var(--v2-success)" : "var(--v2-text-mute)",
          }}>
            {seated.length}/{table.maxSeats}
          </span>
          {table.dealer && table.dealerStartedAt && table.dealerDurationMin && (
            <DealerTimer startedAt={table.dealerStartedAt} durationMin={table.dealerDurationMin} compact />
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
            <button
              onClick={onRotateDealer}
              className="v2-btn-ghost"
              title={nextDealer ? `次の「${nextDealer}」に交代` : "ディーラー欄に次の人がいません"}
              disabled={!nextDealer}
              style={{
                padding: 4, borderRadius: 4,
                display: "inline-flex", alignItems: "center",
                color: nextDealer ? "var(--v2-accent-text)" : "var(--v2-text-mute)",
                opacity: nextDealer ? 1 : 0.5,
                cursor: nextDealer ? "pointer" : "not-allowed",
              }}
            >
              <RefreshCw size={12} />
            </button>
            <button onClick={onClickDealer} className="v2-btn-ghost" title="ディーラー交代" style={{ padding: 4, borderRadius: 4, display: "inline-flex", alignItems: "center" }}>
              <Users size={12} />
            </button>
            <button onClick={onEdit} className="v2-btn-ghost" title="卓を編集" style={{ padding: 4, borderRadius: 4, display: "inline-flex", alignItems: "center" }}>
              <Pencil size={12} />
            </button>
            <button onClick={onDelete} className="v2-btn-ghost" title="卓を削除" style={{ padding: 4, borderRadius: 4, color: "var(--v2-danger)", display: "inline-flex", alignItems: "center" }}>
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* ===== テーブル本体: 角丸長方形フェルト ===== */}
        <div style={{
          position: "relative", width: "100%", height,
          background: isOverTable ? "var(--v2-accent-soft)" : "transparent",
          transition: "background 0.15s",
          padding: 24,
        }}>
          {/* フェルト (角丸長方形) */}
          <div style={{
            position: "absolute",
            left: 24, top: 24, right: 24, bottom: 24,
            borderRadius: 20,
            background: "linear-gradient(180deg, #246c4a 0%, #1a5538 100%)",
            border: "3px solid #2d7a4f",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.1)",
          }}>
            <button
              onClick={onClickDealer}
              title="クリックでディーラー交代"
              style={{
                textAlign: "center", background: "transparent", border: 0, cursor: "pointer",
                padding: "10px 16px", borderRadius: 8,
                transition: "background 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{ fontSize: 14.5, fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>
                {table.dealer || "ディーラー未設定"}
              </div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.16em", marginTop: 3 }}>
                DEALER · 交代
              </div>
            </button>
          </div>

          {/* 席を長方形の周囲に配置 */}
          {seatPositions.map((p, i) => {
            const occupant = seated.find(v => v.seatIndex === i);
            return (
              <Seat
                key={i}
                tableId={table.id}
                seatIndex={i}
                cx={p.cx}
                cy={p.cy}
                occupant={occupant}
                onClickOccupant={onClickVisit}
                onClickEmpty={() => onClickEmptySeat(i)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ===================== ディーラータイマー =====================
function DealerTimer({ startedAt, durationMin, compact }: { startedAt: string; durationMin: number; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const startMs = new Date(startedAt).getTime();
  const elapsedSec = Math.max(0, Math.floor((now - startMs) / 1000));
  const totalSec = durationMin * 60;
  const remainSec = totalSec - elapsedSec;
  const over = remainSec < 0;
  const overSec = -remainSec;
  // 残り5分以下で警告色 (超過前の注意喚起)
  const warn = !over && remainSec <= 300;

  return (
    <span
      title={`持ち時間 ${durationMin}分 · 在卓 ${formatDuration(elapsedSec)}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: compact ? 4 : 6,
        fontSize: compact ? 10.5 : 12, fontWeight: 700,
        padding: compact ? "2px 6px" : "3px 10px",
        borderRadius: 999,
        background: over ? "var(--v2-danger-soft)" : warn ? "var(--v2-warn-soft)" : "var(--v2-bg-alt)",
        color: over ? "var(--v2-danger)" : warn ? "var(--v2-warn)" : "var(--v2-text)",
        fontVariantNumeric: "tabular-nums",
        fontFamily: "var(--v2-num)",
        animation: over ? "v2-blink 1.2s ease-in-out infinite" : undefined,
        flexShrink: 0,
      }}
    >
      <Clock size={compact ? 10 : 11} />
      {!compact && (
        <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.75 }}>
          {over ? "超過" : "残り"}
        </span>
      )}
      <span>{formatDuration(over ? overSec : remainSec, over)}</span>
      {!compact && (
        <>
          <span style={{ width: 1, height: 10, background: "currentColor", opacity: 0.2 }} />
          <span style={{ fontSize: 10, fontWeight: 500, opacity: 0.65 }}>在卓</span>
          <span style={{ fontSize: 11, fontWeight: 600 }}>{formatDuration(elapsedSec)}</span>
        </>
      )}
    </span>
  );
}

/**
 * 経過秒数を読みやすい時間表記に。
 * 1時間未満: "23分45秒"
 * 1時間以上: "1時間23分45秒"
 * over=true で先頭に "+" を付与
 */
function formatDuration(sec: number, over = false): string {
  const safe = Math.max(0, sec);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  const prefix = over ? "+" : "";
  if (h > 0) return `${prefix}${h}時間${String(m).padStart(2, "0")}分${String(s).padStart(2, "0")}秒`;
  if (m > 0) return `${prefix}${m}分${String(s).padStart(2, "0")}秒`;
  return `${prefix}${s}秒`;
}

// ===================== 席 =====================
function Seat({ tableId, seatIndex, cx, cy, occupant, onClickOccupant, onClickEmpty }: {
  tableId: string; seatIndex: number; cx: number; cy: number; occupant?: Visit;
  onClickOccupant: (v: Visit) => void;
  onClickEmpty: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `seat:${tableId}:${seatIndex}` });
  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        left: `${cx}%`, top: `${cy}%`,
        transform: "translate(-50%, -50%)",
        transition: "transform 0.15s",
      }}
    >
      {occupant ? (
        <DraggableVisit visit={occupant} onClick={() => onClickOccupant(occupant)} />
      ) : (
        <button
          onClick={onClickEmpty}
          title={`席${seatIndex + 1}: クリックで待機中のお客様を配置`}
          style={{
            width: 40, height: 40, borderRadius: "50%",
            border: `2px dashed ${isOver ? "var(--v2-accent)" : "var(--v2-border-strong)"}`,
            background: isOver ? "var(--v2-accent-soft)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0,
            color: isOver ? "var(--v2-accent-text)" : "var(--v2-text-mute)",
            transition: "border-color 0.12s, background 0.12s, transform 0.12s",
            transform: isOver ? "scale(1.1)" : "none",
          }}
        >
          {seatIndex + 1}
        </button>
      )}
    </div>
  );
}

// ===================== 移動メニューモーダル =====================
function MoveModal({ visit, tables, visits, alreadyWaitlisted, onClose, onMove, onAddToWaitlist }: {
  visit: Visit;
  tables: TableDef[];
  visits: Visit[];
  alreadyWaitlisted?: boolean;
  onClose: () => void;
  onMove: (visitId: string, tableId: string | null, seatIndex?: number) => void;
  onAddToWaitlist?: () => void;
}) {
  const currentTable = tables.find(t => t.id === visit.tableId);
  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${visit.name} の移動先`}
      footer={<Btn onClick={onClose}>閉じる</Btn>}
    >
      <VStack gap={12}>
        <div style={{ fontSize: 12, color: "var(--v2-text-sub)" }}>
          現在:{" "}
          {currentTable
            ? `${currentTable.name} / 席${(visit.seatIndex ?? 0) + 1}`
            : "未着席"}
        </div>

        {/* ウェイティングリストへ追加 (未着席客のみ) */}
        {!visit.tableId && onAddToWaitlist && (
          <button
            onClick={onAddToWaitlist}
            disabled={alreadyWaitlisted}
            className="v2-btn-ghost"
            style={{
              width: "100%", textAlign: "left",
              padding: "10px 12px", borderRadius: 8,
              border: "1px solid var(--v2-accent)",
              background: alreadyWaitlisted ? "var(--v2-bg-alt)" : "var(--v2-accent-soft)",
              display: "flex", alignItems: "center", gap: 8,
              cursor: alreadyWaitlisted ? "not-allowed" : "pointer",
              opacity: alreadyWaitlisted ? 0.6 : 1,
            }}
          >
            <Clock size={14} style={{ color: "var(--v2-accent-text)" }} />
            <span style={{ fontWeight: 600, color: "var(--v2-accent-text)" }}>
              {alreadyWaitlisted ? "ウェイティングリストに登録済み" : "ウェイティングに追加"}
            </span>
          </button>
        )}

        {/* 未着席に戻す */}
        {visit.tableId && (
          <button
            onClick={() => onMove(visit.id, null)}
            className="v2-btn-ghost"
            style={{
              width: "100%", textAlign: "left",
              padding: "10px 12px", borderRadius: 8,
              border: "1px solid var(--v2-border)", background: "var(--v2-bg)",
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
            }}
          >
            <X size={14} style={{ color: "var(--v2-text-mute)" }} />
            <span style={{ fontWeight: 600 }}>未着席エリアへ戻す</span>
          </button>
        )}

        {tables.length === 0 ? (
          <Empty>移動先の卓がありません</Empty>
        ) : (
          tables.map(t => {
            const tableVisits = visits.filter(v => v.tableId === t.id);
            return (
              <div
                key={t.id}
                style={{
                  border: "1px solid var(--v2-border)",
                  borderRadius: 8,
                  background: "var(--v2-bg)",
                }}
              >
                <div style={{
                  padding: "8px 12px",
                  borderBottom: "1px solid var(--v2-border)",
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, fontWeight: 700,
                }}>
                  <Move size={12} style={{ color: TYPE_COLOR[t.type] }} />
                  {t.name}
                  <span style={{
                    fontSize: 10, padding: "1px 6px", borderRadius: 999,
                    background: `${TYPE_COLOR[t.type]}1a`, color: TYPE_COLOR[t.type],
                  }}>{t.type}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--v2-text-mute)", fontWeight: 500 }}>
                    {tableVisits.length}/{t.maxSeats}席
                  </span>
                </div>
                <div style={{
                  padding: 8,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(56px, 1fr))",
                  gap: 6,
                }}>
                  {Array.from({ length: t.maxSeats }).map((_, i) => {
                    const occupant = tableVisits.find(v => v.seatIndex === i && v.id !== visit.id);
                    const isCurrent = visit.tableId === t.id && visit.seatIndex === i;
                    return (
                      <button
                        key={i}
                        onClick={() => onMove(visit.id, t.id, i)}
                        disabled={isCurrent}
                        title={occupant ? `${occupant.name} と入れ替え` : `席${i + 1}へ移動`}
                        style={{
                          padding: "6px 4px",
                          borderRadius: 6,
                          border: isCurrent
                            ? "1px solid var(--v2-accent)"
                            : occupant
                            ? "1px solid var(--v2-warn)"
                            : "1px dashed var(--v2-border-strong)",
                          background: isCurrent
                            ? "var(--v2-accent-soft)"
                            : occupant
                            ? "var(--v2-warn-soft)"
                            : "var(--v2-bg-alt)",
                          color: isCurrent ? "var(--v2-accent-text)" : "var(--v2-text)",
                          cursor: isCurrent ? "default" : "pointer",
                          fontSize: 11, fontWeight: 600,
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                          opacity: isCurrent ? 0.6 : 1,
                        }}
                      >
                        <span style={{ fontSize: 10, color: "var(--v2-text-mute)" }}>席{i + 1}</span>
                        <span style={{ fontSize: 11 }}>
                          {isCurrent ? "現在" : occupant ? `${occupant.name.slice(0, 4)}と交替` : "空"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </VStack>
    </Modal>
  );
}

// ===================== 空席への配置モーダル =====================
function SeatPickModal({ table, seatIndex, waiting, onClose, onPick }: {
  table: TableDef;
  seatIndex: number;
  waiting: Visit[];
  onClose: () => void;
  onPick: (visitId: string) => void;
}) {
  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${table.name} / 席${seatIndex + 1} に配置`}
      footer={<Btn onClick={onClose}>閉じる</Btn>}
    >
      <VStack gap={12}>
        {waiting.length === 0 ? (
          <Empty>待機中のお客様がいません。入店登録をすると「未着席」に表示されます。</Empty>
        ) : (
          <>
            <div style={{ fontSize: 12, color: "var(--v2-text-sub)" }}>
              配置するお客様を選択してください ({waiting.length}名 待機中)
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {waiting.map((v) => (
                <button
                  key={v.id}
                  onClick={() => onPick(v.id)}
                  style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
                  title={`${v.name} を席${seatIndex + 1}へ`}
                >
                  <VisitChip visit={v} />
                </button>
              ))}
            </div>
          </>
        )}
      </VStack>
    </Modal>
  );
}

// ===================== ディーラー欄パネル =====================
function DealerRunPanel({ run, onAdd, onRemove, onMove }: {
  run: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
  onMove: (name: string, dir: -1 | 1) => void;
}) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(true);

  function submit() {
    const v = input.trim();
    if (!v) return;
    onAdd(v);
    setInput("");
  }

  return (
    <div className="v2-panel" style={{ overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", minHeight: 40, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
          background: "transparent", border: 0, cursor: "pointer",
          textAlign: "left",
        }}
      >
        <Users size={14} style={{ color: "var(--v2-accent-text)" }} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>ディーラー欄</span>
        <span style={{
          fontSize: 11, fontWeight: 600, color: "var(--v2-accent-text)",
          background: "var(--v2-accent-soft)", padding: "1px 8px", borderRadius: 999,
        }}>{run.length}名 待機</span>
        {run[0] && (
          <span style={{ fontSize: 11, color: "var(--v2-text-mute)" }}>
            次: <strong style={{ color: "var(--v2-text)", fontWeight: 700 }}>{run[0]}</strong>
          </span>
        )}
        <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--v2-text-mute)" }}>{open ? "閉じる" : "開く"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--v2-border)" }}>
          {/* 追加フォーム */}
          <div style={{ display: "flex", gap: 6, padding: "10px 0" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
              placeholder="ディーラー名を追加 (Enter)"
              style={{ flex: 1 }}
            />
            <Btn variant="primary" onClick={submit}><Plus size={12}/> 追加</Btn>
          </div>

          {/* 待機列 */}
          {run.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--v2-text-mute)", padding: "4px 0 2px" }}>
              待機ディーラーはいません。名前を追加すると、各卓の「次へ」ボタンで順番に交代できます。
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {run.map((name, i) => (
                <div
                  key={name}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 4px 4px 10px",
                    background: i === 0 ? "var(--v2-accent-soft)" : "var(--v2-bg)",
                    border: i === 0 ? "1px solid var(--v2-accent)" : "1px solid var(--v2-border)",
                    borderRadius: 999,
                    fontSize: 12,
                  }}
                >
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    color: i === 0 ? "var(--v2-accent-text)" : "var(--v2-text-mute)",
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: 600 }}>{name}</span>
                  <button
                    onClick={() => onMove(name, -1)}
                    disabled={i === 0}
                    title="上へ"
                    className="v2-btn-ghost"
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      cursor: i === 0 ? "not-allowed" : "pointer",
                      opacity: i === 0 ? 0.3 : 0.7,
                      color: "var(--v2-text-sub)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      transform: "rotate(180deg)",
                    }}
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={() => onMove(name, 1)}
                    disabled={i === run.length - 1}
                    title="下へ"
                    className="v2-btn-ghost"
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      cursor: i === run.length - 1 ? "not-allowed" : "pointer",
                      opacity: i === run.length - 1 ? 0.3 : 0.7,
                      color: "var(--v2-text-sub)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <ArrowDown size={12} />
                  </button>
                  <button
                    onClick={() => onRemove(name)}
                    title="欄から外す"
                    className="v2-btn-ghost"
                    style={{
                      width: 24, height: 24, borderRadius: 6,
                      cursor: "pointer", color: "var(--v2-danger)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===================== ディーラー交代モーダル =====================
function DealerChangeModal({ table, run, onClose, onChange }: {
  table: TableDef;
  run: string[];
  onClose: () => void;
  onChange: (name: string) => void;
}) {
  const [manual, setManual] = useState("");
  const next = run[0];

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={`${table.name} のディーラー交代`}
      footer={<Btn onClick={onClose}>閉じる</Btn>}
    >
      <VStack gap={14}>
        <div style={{ fontSize: 12, color: "var(--v2-text-sub)" }}>
          現在: <strong style={{ color: "var(--v2-text)" }}>{table.dealer ?? "未設定"}</strong>
          {table.dealer && (
            <span style={{ marginLeft: 8, fontSize: 11, color: "var(--v2-text-mute)" }}>
              ※ 交代後、現ディーラーはディーラー欄の末尾へ移動します
            </span>
          )}
        </div>

        {/* 次のディーラー(ワンタップ) */}
        {next && (
          <button
            onClick={() => onChange(next)}
            style={{
              width: "100%", textAlign: "left",
              padding: "12px 14px", borderRadius: 10,
              border: "1px solid var(--v2-accent)",
              background: "var(--v2-accent-soft)",
              display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
            }}
          >
            <RefreshCw size={16} style={{ color: "var(--v2-accent-text)" }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--v2-accent-text)", letterSpacing: "0.04em" }}>次のディーラー</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>{next}</div>
            </div>
            <span style={{ fontSize: 11, color: "var(--v2-accent-text)", fontWeight: 600 }}>これに交代</span>
          </button>
        )}

        {/* run の他のメンバーから直接選ぶ */}
        {run.length > 1 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--v2-text-mute)", marginBottom: 6, letterSpacing: "0.04em" }}>
              待機列から指名
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {run.slice(1).map((name) => (
                <button
                  key={name}
                  onClick={() => onChange(name)}
                  style={{
                    padding: "6px 12px", borderRadius: 999,
                    border: "1px solid var(--v2-border)",
                    background: "var(--v2-bg)", cursor: "pointer",
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 手入力 */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: "var(--v2-text-mute)", marginBottom: 6, letterSpacing: "0.04em" }}>
            手入力で交代
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && manual.trim()) { e.preventDefault(); onChange(manual.trim()); } }}
              placeholder="ディーラー名を入力"
              list="v2-dealer-run-options"
              style={{ flex: 1 }}
            />
            <Btn variant="primary" onClick={() => manual.trim() && onChange(manual.trim())}>交代</Btn>
          </div>
        </div>

        {/* 解除 */}
        {table.dealer && (
          <button
            onClick={() => onChange("")}
            style={{
              padding: "8px 12px", borderRadius: 8,
              border: "1px solid var(--v2-border)",
              background: "transparent", cursor: "pointer",
              fontSize: 12, color: "var(--v2-danger)",
              display: "inline-flex", alignItems: "center", gap: 6, justifyContent: "center",
            }}
          >
            <X size={12} />ディーラーを解除(無人にする)
          </button>
        )}
      </VStack>
    </Modal>
  );
}

// ===================== ウェイティングリストパネル =====================
function WaitlistPanel({ waitlist, waiting, totalOpenSeats, readyWaitlistId, prefill, onConsumePrefill, onAdd, onCall, onComplete, onCancel, onMove }: {
  waitlist: WaitEntry[];
  waiting: Visit[];
  totalOpenSeats: number;
  readyWaitlistId: string | null;
  prefill: { name: string; visitId?: string } | null;
  onConsumePrefill: () => void;
  onAdd: (entry: { name: string; partySize: number; game: WaitGame; visitId?: string }) => void;
  onCall: (id: string) => void;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
}) {
  const [open, setOpen] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);

  // 待機エリアからの導線でモーダルを自動オープン (ユーザー操作起点の prefill セット時のみ)
  if (prefill && !openAdd) {
    setOpen(true);
    setOpenAdd(true);
  }

  const activeCount = waitlist.filter(w => w.status === "waiting" || w.status === "called").length;

  return (
    <div className="v2-panel" style={{ overflow: "hidden" }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%", minHeight: 40, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 10,
          background: "transparent", border: 0, cursor: "pointer",
          textAlign: "left", flexWrap: "wrap",
        }}
      >
        <Clock size={14} style={{ color: "var(--v2-accent-text)" }} />
        <span style={{ fontSize: 13, fontWeight: 700 }}>ウェイティングリスト</span>
        <span style={{
          fontSize: 11, fontWeight: 600, color: "var(--v2-text)",
          background: "var(--v2-bg-alt)", padding: "1px 8px", borderRadius: 999,
        }}>空席{totalOpenSeats}席 / 待ち{activeCount}組</span>
        {waitlist[0] && (
          <span style={{ fontSize: 11, color: "var(--v2-text-mute)" }}>
            先頭: <strong style={{ color: "var(--v2-text)", fontWeight: 700 }}>{waitlist[0].name}</strong>
          </span>
        )}
        <Btn
          variant="primary"
          size="xs"
          onClick={(e) => { e.stopPropagation(); setOpenAdd(true); }}
          style={{ marginLeft: "auto" }}
        >
          <Plus size={11} /> 登録
        </Btn>
        <span style={{ fontSize: 11, color: "var(--v2-text-mute)" }}>{open ? "閉じる" : "開く"}</span>
      </button>

      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid var(--v2-border)" }}>
          {waitlist.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--v2-text-mute)", padding: "10px 0 2px" }}>
              ウェイティングはいません。満卓時は「登録」から受付できます。
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
              {waitlist.map((w, i) => (
                <WaitlistRow
                  key={w.id}
                  entry={w}
                  index={i}
                  isFirst={i === 0}
                  isLast={i === waitlist.length - 1}
                  isReady={w.id === readyWaitlistId}
                  onCall={() => onCall(w.id)}
                  onComplete={() => onComplete(w.id)}
                  onCancel={() => onCancel(w.id)}
                  onMoveUp={() => onMove(w.id, -1)}
                  onMoveDown={() => onMove(w.id, 1)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {openAdd && (
        <WaitlistAddModal
          waiting={waiting}
          prefill={prefill}
          onClose={() => { setOpenAdd(false); onConsumePrefill(); }}
          onAdd={(entry) => { onAdd(entry); setOpenAdd(false); }}
        />
      )}
    </div>
  );
}

// ===================== ウェイティング1行 =====================
function WaitlistRow({ entry, index, isFirst, isLast, isReady, onCall, onComplete, onCancel, onMoveUp, onMoveDown }: {
  entry: WaitEntry;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isReady: boolean;
  onCall: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const registered = new Date(entry.registeredAt).getTime();
  const waitMin = Math.max(0, Math.floor((now - registered) / 60000));

  const calledMin = entry.calledAt ? Math.max(0, Math.floor((now - new Date(entry.calledAt).getTime()) / 60000)) : null;
  const calledWarn = entry.status === "called" && calledMin != null && calledMin >= CALLED_WARN_MIN;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
        padding: "8px 10px", borderRadius: 8,
        border: isFirst ? "1px solid var(--v2-accent)" : "1px solid var(--v2-border)",
        background: calledWarn ? "var(--v2-danger-soft)" : isFirst ? "var(--v2-accent-soft)" : "var(--v2-bg)",
      }}
    >
      <span style={{
        width: 20, height: 20, borderRadius: 999, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 10.5, fontWeight: 700,
        background: isFirst ? "var(--v2-accent)" : "var(--v2-bg-alt)",
        color: isFirst ? "var(--v2-bg)" : "var(--v2-text-mute)",
      }}>{index + 1}</span>

      <span style={{ fontWeight: 700, fontSize: 13 }}>{entry.name}</span>
      <span style={{ fontSize: 11, color: "var(--v2-text-mute)" }}>{entry.partySize}名</span>
      <span style={{
        fontSize: 9.5, fontWeight: 700, padding: "1px 6px", borderRadius: 999,
        background: `${WAIT_GAME_COLOR[entry.game]}1a`, color: WAIT_GAME_COLOR[entry.game],
      }}>{entry.game}</span>

      {isReady && entry.status === "waiting" && (
        <span style={{
          fontSize: 10, fontWeight: 700, color: "var(--v2-bg)",
          background: "var(--v2-success)", padding: "2px 8px", borderRadius: 999,
        }}>案内可</span>
      )}

      <span style={{ fontSize: 11, color: "var(--v2-text-mute)", fontVariantNumeric: "tabular-nums" }}>
        待ち {waitMin}分
      </span>

      {entry.status === "called" && (
        <span style={{
          fontSize: 10.5, fontWeight: 700,
          color: calledWarn ? "var(--v2-danger)" : "var(--v2-accent-text)",
          display: "inline-flex", alignItems: "center", gap: 3,
        }}>
          呼出済 ({calledMin}分経過){calledWarn ? " ⚠" : ""}
        </span>
      )}

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2 }}>
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          title="上へ"
          className="v2-btn-ghost"
          style={{
            width: 26, height: 26, borderRadius: 6,
            cursor: isFirst ? "not-allowed" : "pointer",
            opacity: isFirst ? 0.3 : 0.7,
            color: "var(--v2-text-sub)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            transform: "rotate(180deg)",
          }}
        >
          <ArrowDown size={12} />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          title="下へ"
          className="v2-btn-ghost"
          style={{
            width: 26, height: 26, borderRadius: 6,
            cursor: isLast ? "not-allowed" : "pointer",
            opacity: isLast ? 0.3 : 0.7,
            color: "var(--v2-text-sub)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <ArrowDown size={12} />
        </button>

        {entry.status === "waiting" ? (
          <Btn size="xs" onClick={onCall}>呼出</Btn>
        ) : (
          <Btn size="xs" variant="primary" onClick={onComplete}>案内済み</Btn>
        )}
        <button
          onClick={onCancel}
          title="取消(離脱)"
          className="v2-btn-ghost"
          style={{
            width: 26, height: 26, borderRadius: 6,
            cursor: "pointer", color: "var(--v2-danger)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ===================== ウェイティング登録モーダル =====================
function WaitlistAddModal({ waiting, prefill, onClose, onAdd }: {
  waiting: Visit[];
  prefill: { name: string; visitId?: string } | null;
  onClose: () => void;
  onAdd: (entry: { name: string; partySize: number; game: WaitGame; visitId?: string }) => void;
}) {
  const [name, setName] = useState(prefill?.name ?? "");
  const [visitId, setVisitId] = useState<string | undefined>(prefill?.visitId);
  const [partySizeStr, setPartySizeStr] = useState("1");
  const [game, setGame] = useState<WaitGame>("指定なし");

  function pickVisit(v: Visit) {
    setName(v.name);
    setVisitId(v.id);
  }

  function submit() {
    const trimmed = name.trim();
    if (!trimmed) { alert("名前を入力してください"); return; }
    const partySize = parseInt(partySizeStr, 10);
    if (!partySize || partySize < 1) { alert("人数は1以上で入力してください"); return; }
    onAdd({ name: trimmed, partySize, game, visitId });
  }

  return (
    <Modal
      open={true}
      onClose={onClose}
      title="ウェイティングに登録"
      footer={<><Btn onClick={onClose}>キャンセル</Btn><Btn variant="primary" onClick={submit}>登録</Btn></>}
    >
      <VStack gap={16}>
        {waiting.length > 0 && (
          <Field label="未着席の来店客から選択" hint="タップで名前欄に反映されます">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {waiting.map(v => (
                <button
                  key={v.id}
                  onClick={() => pickVisit(v)}
                  style={{
                    background: "transparent", border: 0, padding: 0, cursor: "pointer",
                    outline: visitId === v.id ? "2px solid var(--v2-accent)" : "none",
                    borderRadius: 999,
                  }}
                >
                  <VisitChip visit={v} />
                </button>
              ))}
            </div>
          </Field>
        )}
        <Field label="名前" required>
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setVisitId(undefined); }}
            placeholder="お客様名を入力 (手入力可)"
          />
        </Field>
        <Field label="人数">
          <input
            type="text"
            inputMode="numeric"
            value={partySizeStr}
            onChange={(e) => setPartySizeStr(toHalfWidthDigits(e.target.value))}
            onFocus={(e) => e.target.select()}
            placeholder="例: 2"
          />
        </Field>
        <Field label="希望ゲーム">
          <select value={game} onChange={(e) => setGame(e.target.value as WaitGame)}>
            {WAIT_GAME_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </Field>
      </VStack>
    </Modal>
  );
}
