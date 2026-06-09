"use client";

import { useState, useMemo } from "react";
import { usePersistedState } from "@/lib/persist/store";
import { PageHeader, Btn, Panel, Field, Modal, VStack, Empty } from "@/components/v2/ui";
import { Plus, Trash2, Pencil, GripVertical, X } from "lucide-react";
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
}

const RANK_COLOR: Record<CustomerRank, string> = {
  vip: "#7c3aed", gold: "#d97706", silver: "#6b7280", regular: "#9ca3af",
};
const RANK_LABEL: Record<CustomerRank, string> = {
  vip: "VIP", gold: "Gold", silver: "Silver", regular: "",
};
const TYPE_COLOR: Record<TableDef["type"], string> = {
  "トナメ": "#2c9b6a", "リング": "#0e7a55", "サイド": "#6b7280", "BJ": "#1e293b", "バカラ": "#8b5cf6",
};

// ===================== ページ =====================
export default function TablesPage() {
  const [tables, setTables] = usePersistedState<TableDef[]>("v2_tables_v2", []);
  const [visits, setVisits] = usePersistedState<Visit[]>("v2_visits_v1", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [openAdd, setOpenAdd] = useState(false);
  const [editTable, setEditTable] = useState<TableDef | null>(null);
  const [draft, setDraft] = useState<Omit<TableDef, "id">>({ name: "", type: "トナメ", maxSeats: 6, dealer: "" });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const waiting = useMemo(() => visits.filter(v => !v.tableId), [visits]);
  const seated = useMemo(() => visits.filter(v => v.tableId), [visits]);
  const activeVisit = activeId ? visits.find(v => v.id === activeId) : null;
  const activeTableId = activeId?.startsWith("table:") ? activeId.slice(6) : null;
  const activeTable = activeTableId ? tables.find(t => t.id === activeTableId) : null;

  // ===== drag handlers =====
  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }
  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    if (!e.over) return;
    const activeId = String(e.active.id);
    const overId = String(e.over.id);

    // ===== 卓自体のドラッグで並び替え =====
    if (activeId.startsWith("table:")) {
      const fromId = activeId.slice(6);
      if (!overId.startsWith("table-slot:")) return;
      const toId = overId.slice(11);
      if (fromId === toId) return;
      setTables(prev => {
        const fromIdx = prev.findIndex(t => t.id === fromId);
        const toIdx = prev.findIndex(t => t.id === toId);
        if (fromIdx < 0 || toIdx < 0) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIdx, 1);
        next.splice(toIdx, 0, moved);
        return next;
      });
      return;
    }

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
  function addTable() {
    if (!draft.name.trim()) return;
    setTables(prev => [...prev, { id: `t${Date.now()}`, ...draft }]);
    setOpenAdd(false);
    setDraft({ name: "", type: "トナメ", maxSeats: 6, dealer: "" });
  }
  function saveEdit() {
    if (!editTable) return;
    setTables(prev => prev.map(t => t.id === editTable.id ? editTable : t));
    setEditTable(null);
  }
  function removeTable(id: string) {
    const seatedCount = visits.filter(v => v.tableId === id).length;
    if (seatedCount > 0 && !confirm(`この卓に ${seatedCount}名 配置されています。本当に削除しますか？`)) return;
    if (seatedCount === 0 && !confirm("削除しますか？")) return;
    setVisits(prev => prev.map(v => v.tableId === id ? { ...v, tableId: undefined, seatIndex: undefined } : v));
    setTables(prev => prev.filter(t => t.id !== id));
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <VStack gap={16}>
        <PageHeader
          title="卓管理"
          sub={`${tables.length}卓 · 待機 ${waiting.length}名 · 着席 ${seated.length}名`}
          action={<Btn variant="primary" onClick={() => setOpenAdd(true)}><Plus size={14}/> 卓を追加</Btn>}
        />

        {/* ===== 待機エリア (一番上, 未着席のお客様) ===== */}
        <WaitingArea visits={waiting} />

        {/* ===== 卓一覧 ===== */}
        {tables.length === 0 ? (
          <Panel><Empty>卓が登録されていません。「卓を追加」から登録してください。</Empty></Panel>
        ) : (
          <VStack gap={12}>
            {tables.map(t => (
              <TableSlot key={t.id} id={t.id}>
                <PokerTable
                  table={t}
                  seated={visits.filter(v => v.tableId === t.id)}
                  isDragging={activeTableId === t.id}
                  onEdit={() => setEditTable(t)}
                  onDelete={() => removeTable(t.id)}
                />
              </TableSlot>
            ))}
          </VStack>
        )}

        {/* ===== オーバーレイ ===== */}
        <DragOverlay>
          {activeVisit && <VisitChip visit={activeVisit} dragging />}
          {activeTable && (
            <div style={{ opacity: 0.7, transform: "scale(0.98)", pointerEvents: "none" }}>
              <PokerTable table={activeTable} seated={visits.filter(v => v.tableId === activeTable.id)} onEdit={() => {}} onDelete={() => {}} />
            </div>
          )}
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
              <input type="number" min={2} max={12} value={draft.maxSeats} onChange={(e) => setDraft({ ...draft, maxSeats: parseInt(e.target.value) || 6 })} />
            </Field>
            <Field label="ディーラー">
              <input value={draft.dealer ?? ""} onChange={(e) => setDraft({ ...draft, dealer: e.target.value })} placeholder="ディーラー名(任意)" />
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
                <input type="number" min={2} max={12} value={editTable.maxSeats}
                  onChange={(e) => setEditTable({ ...editTable, maxSeats: parseInt(e.target.value) || 6 })} />
              </Field>
              <Field label="ディーラー">
                <input value={editTable.dealer ?? ""} onChange={(e) => setEditTable({ ...editTable, dealer: e.target.value })} />
              </Field>
            </VStack>
          </Modal>
        )}
      </VStack>
    </DndContext>
  );
}

// ===================== 待機エリア =====================
function WaitingArea({ visits }: { visits: Visit[] }) {
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
          ここから卓へドラッグして配置
        </span>
      </div>
      {visits.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--v2-text-mute)" }}>
          待機中のお客様はいません (入店登録から自動で表示されます)
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {visits.map(v => <DraggableVisit key={v.id} visit={v} />)}
        </div>
      )}
    </div>
  );
}

// ===================== ドラッグ可能な顧客チップ =====================
function DraggableVisit({ visit }: { visit: Visit }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: visit.id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1, touchAction: "none" }}
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
        background: dragging ? "var(--v2-accent-soft)" : "#fff",
        border: dragging ? `1px solid var(--v2-accent)` : "1px solid var(--v2-border)",
        borderRadius: 999,
        fontSize: 12, fontWeight: 500,
        cursor: "grab",
        boxShadow: dragging ? "var(--v2-shadow-lg)" : "var(--v2-shadow-sm)",
        userSelect: "none",
      }}
    >
      <span style={{
        width: 22, height: 22, borderRadius: 999,
        background: RANK_COLOR[visit.rank], color: "#fff",
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

// ===================== 卓スロット (卓自体のD&D並び替え) =====================
function TableSlot({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: `table-slot:${id}` });
  return (
    <div ref={setDroppableRef} style={{ position: "relative", outline: isOver ? "2px dashed var(--v2-accent)" : "none", outlineOffset: 4, borderRadius: "var(--v2-radius-lg)" }}>
      {children}
    </div>
  );
}

// ===================== 卓: 横長楕円 =====================
function PokerTable({ table, seated, onEdit, onDelete, isDragging }: {
  table: TableDef;
  seated: Visit[];
  isDragging?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { setNodeRef: setDropRef, isOver: isOverTable } = useDroppable({ id: `table-drop:${table.id}` });
  const dragHandle = useDraggable({ id: `table:${table.id}` });

  const occupancy = seated.length / table.maxSeats;
  const tableHeight = table.maxSeats > 8 ? 240 : 200;

  return (
    <Panel>
      <div ref={setDropRef} style={{ opacity: isDragging ? 0.4 : 1 }}>
        {/* ===== ヘッダー ===== */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          padding: "12px 16px",
          borderBottom: "1px solid var(--v2-border)",
        }}>
          {/* ドラッグハンドル (卓を並び替える) */}
          <button
            ref={dragHandle.setNodeRef}
            {...dragHandle.listeners}
            {...dragHandle.attributes}
            style={{
              cursor: "grab", padding: 4, color: "var(--v2-text-mute)",
              background: "transparent", border: 0, touchAction: "none",
            }}
            title="ドラッグで並び替え"
          >
            <GripVertical size={14} />
          </button>
          <strong style={{ fontSize: 15, fontWeight: 700 }}>{table.name}</strong>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
            background: `${TYPE_COLOR[table.type]}1a`, color: TYPE_COLOR[table.type],
          }}>{table.type}</span>
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: occupancy >= 1 ? "var(--v2-danger)" : occupancy >= 0.7 ? "var(--v2-warn)" : seated.length > 0 ? "var(--v2-success)" : "var(--v2-text-mute)",
          }}>
            {seated.length}/{table.maxSeats}席
          </span>
          {table.dealer && (
            <span style={{ fontSize: 12, color: "var(--v2-text-sub)" }}>D: {table.dealer}</span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
            <button onClick={onEdit} className="v2-btn-ghost" style={{ padding: "4px 8px", borderRadius: 4, display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <Pencil size={12} />編集
            </button>
            <button onClick={onDelete} className="v2-btn-ghost" style={{ padding: "4px 8px", borderRadius: 4, color: "var(--v2-danger)", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12 }}>
              <Trash2 size={12} />削除
            </button>
          </div>
        </div>

        {/* ===== テーブル: 横長楕円 ===== */}
        <div style={{
          position: "relative", width: "100%", height: tableHeight,
          background: isOverTable ? "var(--v2-accent-soft)" : "transparent",
          transition: "background 0.15s",
        }}>
          {/* 楕円 */}
          <div style={{
            position: "absolute",
            left: "20%", top: "18%", right: "20%", bottom: "18%",
            borderRadius: "50%",
            background: "linear-gradient(180deg, #246c4a 0%, #1a5538 100%)",
            border: "3px solid #2d7a4f",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "inset 0 4px 12px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.1)",
          }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>
                {table.dealer || "ディーラー未設定"}
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.16em", marginTop: 2 }}>
                DEALER
              </div>
            </div>
          </div>

          {/* 席を楕円の周囲に配置 */}
          {Array.from({ length: table.maxSeats }).map((_, i) => {
            const angle = (360 / table.maxSeats) * i - 90;
            const rad = (angle * Math.PI) / 180;
            const rx = 36; // 楕円配置の横半径(%)
            const ry = 44; // 縦半径(%)
            const cx = 50 + rx * Math.cos(rad);
            const cy = 50 + ry * Math.sin(rad);
            const occupant = seated.find(v => v.seatIndex === i);
            return (
              <Seat key={i} tableId={table.id} seatIndex={i} cx={cx} cy={cy} occupant={occupant} />
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

// ===================== 席 =====================
function Seat({ tableId, seatIndex, cx, cy, occupant }: {
  tableId: string; seatIndex: number; cx: number; cy: number; occupant?: Visit;
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
        <DraggableVisit visit={occupant} />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          border: `2px dashed ${isOver ? "var(--v2-accent)" : "var(--v2-border-strong)"}`,
          background: isOver ? "var(--v2-accent-soft)" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 600,
          color: isOver ? "var(--v2-accent-text)" : "var(--v2-text-mute)",
          transition: "border-color 0.12s, background 0.12s, transform 0.12s",
          transform: isOver ? "scale(1.1)" : "none",
        }}>
          {seatIndex + 1}
        </div>
      )}
    </div>
  );
}

// 未使用警告抑制
void X;
