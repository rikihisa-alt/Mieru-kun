"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { User, Users, ChevronRight, Dice5, X, RotateCcw } from "lucide-react";

// --- 型定義 ---
interface Player {
  id: string;
  name: string;
  rank: string;
  chips: number;
  tableId: string | null;
  seatIndex: number | null;
}

interface Table {
  id: string;
  name: string;
  type: "トナメ" | "リング" | "サイド";
  maxSeats: number;
  dealer: string;
  dealerMinutes: number;
  status: "idle" | "active" | "full" | "paused";
}

// --- 初期データ ---
const INITIAL_TABLES: Table[] = [
  { id: "t1", name: "テーブル1", type: "トナメ", maxSeats: 9, dealer: "山田", dealerMinutes: 45, status: "active" },
  { id: "t2", name: "テーブル2", type: "トナメ", maxSeats: 9, dealer: "鈴木", dealerMinutes: 20, status: "active" },
  { id: "t3", name: "テーブル3", type: "リング", maxSeats: 10, dealer: "佐藤", dealerMinutes: 60, status: "active" },
  { id: "t4", name: "テーブル4", type: "サイド", maxSeats: 6, dealer: "—", dealerMinutes: 0, status: "idle" },
];

const INITIAL_PLAYERS: Player[] = [
  { id: "p1", name: "田中 太郎", rank: "gold", chips: 5000, tableId: "t1", seatIndex: 0 },
  { id: "p2", name: "鈴木 花子", rank: "vip", chips: 12000, tableId: "t1", seatIndex: 2 },
  { id: "p3", name: "佐藤 健一", rank: "silver", chips: 2000, tableId: "t1", seatIndex: 4 },
  { id: "p4", name: "高橋 美咲", rank: "regular", chips: 500, tableId: "t3", seatIndex: 1 },
  { id: "p5", name: "伊藤 大輔", rank: "regular", chips: 0, tableId: "t3", seatIndex: 3 },
  { id: "p6", name: "渡辺 優子", rank: "gold", chips: 8000, tableId: null, seatIndex: null },
  { id: "p7", name: "山本 翔太", rank: "silver", chips: 1500, tableId: null, seatIndex: null },
  { id: "p8", name: "中村 あゆみ", rank: "regular", chips: 200, tableId: null, seatIndex: null },
];

export default function TablesPage() {
  const [tables] = useState<Table[]>(INITIAL_TABLES);
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const waitingPlayers = players.filter((p) => p.tableId === null);
  const getTablePlayers = useCallback((tableId: string) => players.filter((p) => p.tableId === tableId), [players]);

  function handleDragStart(e: DragStartEvent) {
    const p = players.find((x) => x.id === e.active.id);
    setActivePlayer(p ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActivePlayer(null);
    if (!e.over) return;
    const playerId = e.active.id as string;
    const targetId = e.over.id as string;

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;
        if (targetId === "waiting") {
          return { ...p, tableId: null, seatIndex: null };
        }
        if (targetId.startsWith("t")) {
          const table = tables.find((t) => t.id === targetId);
          const seated = prev.filter((x) => x.tableId === targetId && x.id !== playerId);
          if (!table || seated.length >= table.maxSeats) return p;
          const usedSeats = new Set(seated.map((x) => x.seatIndex));
          let seat = 0;
          while (usedSeats.has(seat)) seat++;
          return { ...p, tableId: targetId, seatIndex: seat };
        }
        return p;
      })
    );
  }

  function removeFromTable(playerId: string) {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, tableId: null, seatIndex: null } : p)));
  }

  const selTable = selectedTable ? tables.find((t) => t.id === selectedTable) : null;
  const selTablePlayers = selectedTable ? getTablePlayers(selectedTable) : [];

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-[calc(100vh-7rem)]">
        {/* ===== 左: 待機 + 卓エリア ===== */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* 待機顧客エリア */}
          <WaitingArea players={waitingPlayers} />

          {/* 卓エリア */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
              {tables.map((table) => {
                const tPlayers = getTablePlayers(table.id);
                return (
                  <TableCard
                    key={table.id}
                    table={table}
                    players={tPlayers}
                    selected={selectedTable === table.id}
                    onSelect={() => setSelectedTable(table.id)}
                    onRemovePlayer={removeFromTable}
                    onSelectPlayer={setSelectedPlayer}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== 右: 詳細パネル ===== */}
        <div className="w-72 bg-bg-white border border-border rounded-[var(--radius-lg)] flex flex-col overflow-hidden">
          {selTable ? (
            <>
              <div className="px-4 py-3 border-b border-border-light">
                <div className="flex items-center justify-between">
                  <span className="text-[14px] font-semibold">{selTable.name}</span>
                  <TypeBadge type={selTable.type} />
                </div>
                <div className="flex items-center gap-3 mt-2 text-[11px] text-text-tertiary">
                  <span>{selTablePlayers.length}/{selTable.maxSeats} 席</span>
                  <span>D: {selTable.dealer}</span>
                  {selTable.dealerMinutes > 0 && <span>{selTable.dealerMinutes}分</span>}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                {selTablePlayers.length === 0 ? (
                  <p className="text-[12px] text-text-tertiary text-center py-4">プレイヤーなし</p>
                ) : (
                  selTablePlayers.map((p) => (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between px-3 py-2 rounded-[var(--radius)] cursor-pointer transition-colors ${
                        selectedPlayer?.id === p.id ? "bg-accent-light" : "hover:bg-bg-hover"
                      }`}
                      onClick={() => setSelectedPlayer(p)}
                    >
                      <div className="flex items-center gap-2">
                        <RankDot rank={p.rank} />
                        <span className="text-[12px] font-medium">{p.name}</span>
                      </div>
                      <span className="text-[11px] text-text-tertiary">{p.chips.toLocaleString()}枚</span>
                    </div>
                  ))
                )}
              </div>
              {/* ディーラー変更 */}
              <div className="px-4 py-3 border-t border-border-light">
                <label className="text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">ディーラー</label>
                <select className="mt-1 text-[12px]" defaultValue={selTable.dealer}>
                  <option>山田</option><option>鈴木</option><option>佐藤</option><option>高橋</option>
                </select>
              </div>
            </>
          ) : selectedPlayer ? (
            <PlayerDetail player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[12px] text-text-tertiary">卓をクリックして詳細表示</p>
            </div>
          )}
        </div>
      </div>

      {/* ドラッグ中の表示 */}
      <DragOverlay>
        {activePlayer && <PlayerChip player={activePlayer} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}

// ==================== 待機エリア ====================
function WaitingArea({ players }: { players: Player[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "waiting" });
  return (
    <div
      ref={setNodeRef}
      className={`bg-bg-white border rounded-[var(--radius-lg)] px-4 py-3 transition-colors ${
        isOver ? "border-accent bg-accent-light" : "border-border"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
          待機中
        </span>
        <span className="text-[12px] font-bold text-accent">{players.length}名</span>
      </div>
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {players.length === 0 ? (
          <span className="text-[11px] text-text-tertiary">待機中の顧客はいません</span>
        ) : (
          players.map((p) => <DraggablePlayer key={p.id} player={p} />)
        )}
      </div>
    </div>
  );
}

// ==================== ドラッグ可能な顧客 ====================
function DraggablePlayer({ player }: { player: Player }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: player.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{ opacity: isDragging ? 0.4 : 1 }}>
      <PlayerChip player={player} />
    </div>
  );
}

function PlayerChip({ player, isDragging }: { player: Player; isDragging?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 bg-bg-white border rounded-[var(--radius)] text-[11px] font-medium cursor-grab select-none ${
      isDragging ? "border-accent shadow-md scale-105" : "border-border hover:border-accent/40"
    }`}>
      <RankDot rank={player.rank} />
      {player.name.split(" ")[0]}
    </div>
  );
}

// ==================== 卓カード（円形テーブル）====================
function TableCard({
  table, players, selected, onSelect, onRemovePlayer, onSelectPlayer,
}: {
  table: Table; players: Player[]; selected: boolean;
  onSelect: () => void; onRemovePlayer: (id: string) => void; onSelectPlayer: (p: Player) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: table.id });
  const occupancy = players.length / table.maxSeats;
  const statusColor = table.status === "idle" ? "text-text-tertiary" :
    occupancy >= 1 ? "text-status-danger" : occupancy > 0.7 ? "text-status-warning" : "text-status-success";

  return (
    <div
      ref={setNodeRef}
      onClick={onSelect}
      className={`bg-bg-white border rounded-[var(--radius-lg)] p-4 cursor-pointer transition-all ${
        isOver ? "border-accent bg-accent-light/30 scale-[1.01]" :
        selected ? "border-accent" : "border-border hover:border-border-light"
      }`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Dice5 className={`w-4 h-4 ${table.status === "idle" ? "text-text-tertiary" : "text-accent"}`} />
          <span className="text-[13px] font-semibold">{table.name}</span>
        </div>
        <TypeBadge type={table.type} />
      </div>

      {/* 円形テーブル表現 */}
      <div className="relative w-full aspect-square max-w-[180px] mx-auto my-2">
        {/* テーブル本体（楕円） */}
        <div className="absolute inset-[15%] rounded-full bg-[#1a5c3a] border-4 border-[#2d7a4f] flex items-center justify-center">
          <div className="text-center">
            <span className="text-[10px] text-white/80 font-medium block">{table.dealer !== "—" ? table.dealer : ""}</span>
            <span className="text-[9px] text-white/50">D</span>
          </div>
        </div>

        {/* 席 */}
        {Array.from({ length: table.maxSeats }).map((_, i) => {
          const angle = (360 / table.maxSeats) * i - 90;
          const rad = (angle * Math.PI) / 180;
          const x = 50 + 42 * Math.cos(rad);
          const y = 50 + 42 * Math.sin(rad);
          const player = players.find((p) => p.seatIndex === i);

          return (
            <div
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {player ? (
                <DraggablePlayer player={player} />
              ) : (
                <div className="w-6 h-6 rounded-full border border-dashed border-border flex items-center justify-center">
                  <span className="text-[8px] text-text-tertiary">{i + 1}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between mt-2 text-[11px]">
        <span className={`font-semibold ${statusColor}`}>
          {players.length}/{table.maxSeats}
        </span>
        <span className="text-text-tertiary">
          {table.dealerMinutes > 0 ? `${table.dealerMinutes}分` : "—"}
        </span>
      </div>
    </div>
  );
}

// ==================== プレイヤー詳細 ====================
function PlayerDetail({ player, onClose }: { player: Player; onClose: () => void }) {
  const rankMap: Record<string, string> = { regular: "レギュラー", silver: "シルバー", gold: "ゴールド", vip: "VIP" };
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border-light flex items-center justify-between">
        <span className="text-[14px] font-semibold">{player.name}</span>
        <button onClick={onClose} className="p-1 hover:bg-bg-hover rounded-[var(--radius)]">
          <X className="w-4 h-4 text-text-tertiary" />
        </button>
      </div>
      <div className="p-4 space-y-3 text-[12px]">
        <div className="flex justify-between"><span className="text-text-tertiary">ランク</span><span className="font-medium">{rankMap[player.rank] ?? player.rank}</span></div>
        <div className="flex justify-between"><span className="text-text-tertiary">チップ</span><span className="font-bold">{player.chips.toLocaleString()}枚</span></div>
        <div className="flex justify-between"><span className="text-text-tertiary">配置</span><span>{player.tableId ?? "待機中"}</span></div>
      </div>
    </div>
  );
}

// ==================== 共通部品 ====================
function TypeBadge({ type }: { type: string }) {
  const color = type === "トナメ" ? "bg-accent-light text-accent" :
    type === "リング" ? "bg-status-success-bg text-status-success" : "bg-bg text-text-secondary";
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-[var(--radius-sm)] font-medium ${color}`}>{type}</span>;
}

function RankDot({ rank }: { rank: string }) {
  const color = rank === "vip" ? "bg-purple-500" : rank === "gold" ? "bg-amber-500" : rank === "silver" ? "bg-gray-400" : "bg-gray-300";
  return <div className={`w-2 h-2 rounded-full ${color}`} />;
}
