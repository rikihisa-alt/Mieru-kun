"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useAppStore } from "@/lib/store/app-store";
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
import { Dice5, X, Plus, Pencil, Trash2, ChevronDown, ChevronUp, User } from "lucide-react";
import { CustomerActionMenu } from "@/components/shared/customer-action-menu";

// --- 型 ---
interface Player {
  id: string; name: string; nickname: string; rank: string; chips: number;
  tableId: string | null; seatIndex: number | null;
}
interface TableDef {
  id: string; name: string; type: "トナメ" | "リング" | "サイド";
  maxSeats: number; dealer: string; dealerMinutes: number;
}

// --- 初期データ ---
const INIT_TABLES: TableDef[] = [
  { id: "t1", name: "テーブル1", type: "トナメ", maxSeats: 9, dealer: "山田", dealerMinutes: 45 },
  { id: "t2", name: "テーブル2", type: "トナメ", maxSeats: 9, dealer: "鈴木", dealerMinutes: 20 },
  { id: "t3", name: "テーブル3", type: "リング", maxSeats: 10, dealer: "佐藤", dealerMinutes: 60 },
  { id: "t4", name: "テーブル4", type: "サイド", maxSeats: 6, dealer: "—", dealerMinutes: 0 },
];

const INIT_PLAYERS: Player[] = [
  { id: "p1", name: "田中 太郎", nickname: "タロウ", rank: "gold", chips: 5000, tableId: "t1", seatIndex: 0 },
  { id: "p2", name: "鈴木 花子", nickname: "ハナ", rank: "vip", chips: 12000, tableId: "t1", seatIndex: 2 },
  { id: "p3", name: "佐藤 健一", nickname: "ケン", rank: "silver", chips: 2000, tableId: "t1", seatIndex: 4 },
  { id: "p4", name: "高橋 美咲", nickname: "ミィ", rank: "regular", chips: 500, tableId: "t3", seatIndex: 1 },
  { id: "p5", name: "伊藤 大輔", nickname: "ダイ", rank: "regular", chips: 0, tableId: "t3", seatIndex: 3 },
  { id: "p6", name: "渡辺 優子", nickname: "ユウ", rank: "gold", chips: 8000, tableId: null, seatIndex: null },
  { id: "p7", name: "山本 翔太", nickname: "ショウ", rank: "silver", chips: 1500, tableId: null, seatIndex: null },
  { id: "p8", name: "中村 あゆみ", nickname: "アユ", rank: "regular", chips: 200, tableId: null, seatIndex: null },
];

const RANK_COLORS: Record<string, string> = { vip: "#7c3aed", gold: "#d97706", silver: "#6b7280", regular: "#9ca3af" };
const RANK_LABELS: Record<string, string> = { vip: "VIP", gold: "Gold", silver: "Silver", regular: "" };

export default function TablesPage() {
  const updateTables = useAppStore().updateTables;
  const [tables, setTables] = useState<TableDef[]>(INIT_TABLES);
  const [players, setPlayers] = useState<Player[]>(INIT_PLAYERS);

  // 卓の稼働状況をダッシュボードに同期
  useEffect(() => {
    const synced = tables.map(t => ({
      name: t.name,
      occupied: players.filter(p => p.tableId === t.id).length,
      max: t.maxSeats,
      type: t.type,
    }));
    updateTables(synced);
  }, [tables, players, updateTables]);
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  // 卓編集モーダル
  const [editingTable, setEditingTable] = useState<TableDef | null>(null);

  // 卓追加
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableType, setNewTableType] = useState<"トナメ" | "リング" | "サイド">("トナメ");
  const [newTableSeats, setNewTableSeats] = useState(9);

  // プレイヤーポップオーバー
  const [popoverPlayer, setPopoverPlayer] = useState<{ player: Player; x: number; y: number } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const waitingPlayers = players.filter(p => p.tableId === null);
  const getTablePlayers = useCallback((tid: string) => players.filter(p => p.tableId === tid), [players]);

  function handleDragStart(e: DragStartEvent) {
    setActivePlayer(players.find(p => p.id === e.active.id) ?? null);
    setPopoverPlayer(null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActivePlayer(null);
    if (!e.over) return;
    const pid = e.active.id as string;
    const targetId = e.over.id as string;

    setPlayers(prev => prev.map(p => {
      if (p.id !== pid) return p;

      // 待機エリアへ戻す
      if (targetId === "waiting") return { ...p, tableId: null, seatIndex: null };

      // 席へのドロップ: "seat-{tableId}-{seatIndex}"
      if (targetId.startsWith("seat-")) {
        const parts = targetId.split("-");
        const tableId = parts[1];
        const seatIdx = parseInt(parts[2], 10);
        const table = tables.find(t => t.id === tableId);
        if (!table) return p;
        const occupant = prev.find(x => x.tableId === tableId && x.seatIndex === seatIdx && x.id !== pid);
        if (occupant) return p;
        return { ...p, tableId, seatIndex: seatIdx };
      }

      // 卓全体へのドロップ
      if (targetId.startsWith("t")) {
        const table = tables.find(t => t.id === targetId);
        if (!table) return p;
        const seated = prev.filter(x => x.tableId === targetId && x.id !== pid);
        if (seated.length >= table.maxSeats) return p;
        const usedSeats = new Set(seated.map(x => x.seatIndex));
        let seat = 0;
        while (usedSeats.has(seat)) seat++;
        return { ...p, tableId: targetId, seatIndex: seat };
      }
      return p;
    }));
  }

  function removeFromTable(pid: string) {
    setPlayers(prev => prev.map(p => p.id === pid ? { ...p, tableId: null, seatIndex: null } : p));
  }

  // 卓CRUD
  function addTable() {
    if (!newTableName.trim()) return;
    const id = `t${Date.now()}`;
    setTables(prev => [...prev, { id, name: newTableName, type: newTableType, maxSeats: newTableSeats, dealer: "—", dealerMinutes: 0 }]);
    setNewTableName(""); setNewTableSeats(9); setShowAddTable(false);
  }
  function deleteTable(tid: string) {
    const hasPlayers = players.some(p => p.tableId === tid);
    if (hasPlayers) {
      if (!window.confirm("この卓に配置されているお客さんが存在します。\n本当に削除してよろしいですか？")) return;
    }
    setPlayers(prev => prev.map(p => p.tableId === tid ? { ...p, tableId: null, seatIndex: null } : p));
    setTables(prev => prev.filter(t => t.id !== tid));
    if (expandedTable === tid) setExpandedTable(null);
  }
  function updateTable(tid: string, updates: Partial<TableDef>) {
    setTables(prev => prev.map(t => t.id === tid ? { ...t, ...updates } : t));
    setEditingTable(null);
  }

  function handlePlayerChipClick(player: Player, event: React.MouseEvent) {
    event.stopPropagation();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverPlayer({ player, x: rect.left + rect.width / 2, y: rect.top });
  }

  // ページクリックでポップオーバー閉じる
  function handlePageClick() {
    if (popoverPlayer) setPopoverPlayer(null);
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col h-[calc(100vh-7rem)]" onClick={handlePageClick}>
        {/* ヘッダー行 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="みえるくん" width={20} height={20} />
            <span className="text-[13px] text-text-secondary">
              稼働 <strong className="text-text-primary">{tables.filter(t => getTablePlayers(t.id).length > 0).length}</strong> / {tables.length} 卓
            </span>
          </div>
          <button onClick={() => setShowAddTable(true)}
            className="flex items-center gap-1 px-3 py-[7px] bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover transition-colors">
            <Plus className="w-3.5 h-3.5" />卓を追加
          </button>
        </div>

        {/* 卓追加フォーム */}
        {showAddTable && (
          <div className="pb-4 border-b border-border-light flex items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">卓名</label>
              <input type="text" value={newTableName} onChange={e => setNewTableName(e.target.value)} placeholder="テーブル5" className="mt-1 text-[13px]" />
            </div>
            <div className="w-28">
              <label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">種別</label>
              <select value={newTableType} onChange={e => setNewTableType(e.target.value as typeof newTableType)} className="mt-1 text-[13px]">
                <option>トナメ</option><option>リング</option><option>サイド</option>
              </select>
            </div>
            <div className="w-20">
              <label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">席数</label>
              <input type="number" min={2} max={12} value={newTableSeats} onChange={e => setNewTableSeats(parseInt(e.target.value) || 6)} className="mt-1 text-[13px]" />
            </div>
            <button onClick={addTable} className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover">追加</button>
            <button onClick={() => setShowAddTable(false)} className="px-3 py-2 border border-border text-[13px] rounded-[6px] hover:bg-bg-hover">取消</button>
          </div>
        )}

        {/* 待機エリア */}
        <WaitingArea players={waitingPlayers} onPlayerClick={handlePlayerChipClick} />

        {/* 卓エリア - 縦並び・全幅 */}
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 mt-3">
          {tables.map(table => (
            <TableCard
              key={table.id}
              table={table}
              players={getTablePlayers(table.id)}
              expanded={expandedTable === table.id}
              onToggleExpand={() => setExpandedTable(expandedTable === table.id ? null : table.id)}
              onEdit={() => setEditingTable(table)}
              onDelete={() => deleteTable(table.id)}
              onRemovePlayer={removeFromTable}
              onPlayerClick={handlePlayerChipClick}
            />
          ))}
        </div>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>{activePlayer && <PlayerChip player={activePlayer} isDragging />}</DragOverlay>

      {/* 編集モーダル */}
      {editingTable && (
        <EditModal
          table={editingTable}
          onSave={(updates) => updateTable(editingTable.id, updates)}
          onClose={() => setEditingTable(null)}
        />
      )}

      {/* プレイヤーポップオーバー */}
      {popoverPlayer && (
        <CustomerActionMenu
          customer={{
            id: popoverPlayer.player.id,
            name: popoverPlayer.player.nickname || popoverPlayer.player.name,
            realName: popoverPlayer.player.nickname ? popoverPlayer.player.name : undefined,
            rank: popoverPlayer.player.rank,
            chips: popoverPlayer.player.chips,
            extra: popoverPlayer.player.tableId ? (
              <button
                onClick={() => { removeFromTable(popoverPlayer.player.id); setPopoverPlayer(null); }}
                className="w-full flex items-center justify-center gap-1 py-1.5 text-[12px] text-status-danger bg-status-danger-bg rounded-[6px] hover:bg-[#f8d7d4] transition-colors"
              >
                <X className="w-3 h-3" />卓から外す
              </button>
            ) : null,
          }}
          x={popoverPlayer.x}
          y={popoverPlayer.y}
          onClose={() => setPopoverPlayer(null)}
        />
      )}
    </DndContext>
  );
}

// ==================== 編集モーダル ====================
function EditModal({ table, onSave, onClose }: {
  table: TableDef;
  onSave: (updates: Partial<TableDef>) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(table.name);
  const [type, setType] = useState(table.type);
  const [maxSeats, setMaxSeats] = useState(table.maxSeats);
  const [dealer, setDealer] = useState(table.dealer);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-[2px]" onClick={onClose}>
      <div className="bg-white rounded-[8px] border border-border shadow-xl w-[380px] p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="t-heading">卓を編集</span>
          <button onClick={onClose} className="p-1 hover:bg-bg-hover rounded-[4px]">
            <X className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
        <div>
          <label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider block mb-1">卓名</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)}
            className="w-full text-[13px] border border-border rounded-[6px] px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider block mb-1">種別</label>
          <select value={type} onChange={e => setType(e.target.value as TableDef["type"])}
            className="w-full text-[13px] border border-border rounded-[6px] px-3 py-2 focus:outline-none focus:border-accent">
            <option>トナメ</option><option>リング</option><option>サイド</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider block mb-1">席数</label>
          <input type="number" min={2} max={12} value={maxSeats} onChange={e => setMaxSeats(parseInt(e.target.value) || 6)}
            className="w-full text-[13px] border border-border rounded-[6px] px-3 py-2 focus:outline-none focus:border-accent" />
        </div>
        <div>
          <label className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider block mb-1">ディーラー</label>
          <select value={dealer} onChange={e => setDealer(e.target.value)}
            className="w-full text-[13px] border border-border rounded-[6px] px-3 py-2 focus:outline-none focus:border-accent">
            <option>山田</option><option>鈴木</option><option>佐藤</option><option>高橋</option><option>—</option>
          </select>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={() => onSave({ name, type, maxSeats, dealer })}
            className="flex-1 py-2 bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover transition-colors">
            保存
          </button>
          <button onClick={onClose}
            className="px-4 py-2 border border-border text-[13px] text-text-secondary rounded-[6px] hover:bg-bg-hover transition-colors">
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== 待機エリア ====================
function WaitingArea({ players, onPlayerClick }: {
  players: Player[];
  onPlayerClick: (player: Player, event: React.MouseEvent) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "waiting" });
  return (
    <div ref={setNodeRef} className={`pb-3 border-b transition-colors ${isOver ? "border-accent bg-accent-light rounded-[6px] px-3 py-2" : "border-border-light"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="t-label">待機中</span>
        <span className="text-[12px] font-bold text-accent">{players.length}名</span>
      </div>
      <div className="flex flex-wrap gap-1.5 min-h-[36px]">
        {players.length === 0 ? <span className="text-[11px] text-text-tertiary">待機中の顧客はいません</span>
        : players.map(p => <DraggablePlayer key={p.id} player={p} onChipClick={onPlayerClick} />)}
      </div>
    </div>
  );
}

// ==================== ドラッグ可能な顧客 ====================
function DraggablePlayer({ player, onChipClick }: {
  player: Player;
  onChipClick?: (player: Player, event: React.MouseEvent) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: player.id });
  return (
    <div ref={setNodeRef} {...listeners} {...attributes}
      style={{ opacity: isDragging ? 0.3 : 1, touchAction: "none" }}
      onClick={e => { if (!isDragging && onChipClick) onChipClick(player, e); }}>
      <PlayerChip player={player} />
    </div>
  );
}

function PlayerChip({ player, isDragging }: { player: Player; isDragging?: boolean }) {
  const label = RANK_LABELS[player.rank];
  const display = player.nickname || player.name.split(" ")[0];
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium cursor-grab select-none rounded-[4px] whitespace-nowrap ${
      isDragging ? "dragging bg-accent-light border border-accent" : "hover:bg-bg-hover"
    }`} style={{ transition: "transform 0.1s, box-shadow 0.1s, border-color 0.1s" }}>
      <div className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: RANK_COLORS[player.rank] }}>
        {display.charAt(0)}
      </div>
      <span className="whitespace-nowrap">{display}</span>
      {label && <span className="whitespace-nowrap text-[9px] px-1 py-0.5 rounded bg-bg-hover text-text-secondary">{label}</span>}
    </div>
  );
}

// ==================== 卓カード（全幅・横長楕円 + インライン詳細） ====================
function TableCard({ table, players, expanded, onToggleExpand, onEdit, onDelete, onRemovePlayer, onPlayerClick }: {
  table: TableDef; players: Player[]; expanded: boolean;
  onToggleExpand: () => void; onEdit: () => void; onDelete: () => void;
  onRemovePlayer: (pid: string) => void;
  onPlayerClick: (player: Player, event: React.MouseEvent) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: table.id });
  const occupancy = table.maxSeats > 0 ? players.length / table.maxSeats : 0;
  const borderColor = isOver ? "border-accent bg-accent-light/20" : expanded ? "border-accent" : occupancy >= 1 ? "border-[#c5221f]/40" : "border-border";

  const tableHeight = Math.max(180, table.maxSeats > 8 ? 220 : 180);

  return (
    <div ref={setNodeRef}
      className={`border rounded-[8px] cursor-pointer ${borderColor}`}
      style={{ transition: "transform 0.1s, border-color 0.15s, box-shadow 0.15s" }}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-5 pb-0" onClick={onToggleExpand}>
        <div className="flex items-center gap-3">
          <Dice5 className={`w-4 h-4 ${players.length > 0 ? "text-accent" : "text-text-tertiary"}`} />
          <span className="text-[15px] font-semibold">{table.name}</span>
          <TypeBadge type={table.type} />
          <span className={`text-[12px] font-semibold ${occupancy >= 1 ? "text-status-danger" : occupancy > 0.7 ? "text-status-warning" : players.length > 0 ? "text-status-success" : "text-text-tertiary"}`}>
            {players.length}/{table.maxSeats}席
          </span>
          {table.dealer !== "—" && (
            <span className="text-[11px] text-text-secondary">D: {table.dealer}</span>
          )}
          {table.dealerMinutes > 0 && (
            <span className="text-[11px] text-text-tertiary">{table.dealerMinutes}分</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={e => { e.stopPropagation(); onEdit(); }} className="p-1.5 hover:bg-bg-hover rounded-[4px]"><Pencil className="w-3.5 h-3.5 text-text-tertiary" /></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1.5 hover:bg-status-danger-bg rounded-[4px]"><Trash2 className="w-3.5 h-3.5 text-status-danger/50" /></button>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-text-tertiary ml-1" />
            : <ChevronDown className="w-4 h-4 text-text-tertiary ml-1" />}
        </div>
      </div>

      {/* テーブル: 横長楕円(幅を短めにしてプレイヤー名のスペース確保) */}
      <div className="relative w-full p-5 pt-4" style={{ height: `${tableHeight + 40}px` }} onClick={onToggleExpand}>
        <div className="absolute rounded-[50%] bg-[#1a5c3a] border-[3px] border-[#2d7a4f]"
          style={{ left: "22%", top: "20%", right: "22%", bottom: "20%" }}>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <span className="text-[12px] text-white/90 font-medium block">{table.dealer !== "—" ? table.dealer : ""}</span>
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Dealer</span>
            </div>
          </div>
        </div>

        {/* 席 - 楕円の周囲に配置 (楕円幅に合わせて rx も縮小) */}
        {Array.from({ length: table.maxSeats }).map((_, i) => {
          const angle = (360 / table.maxSeats) * i - 90;
          const rad = (angle * Math.PI) / 180;
          const rx = 34;
          const ry = 42;
          const cx = 50 + rx * Math.cos(rad);
          const cy = 50 + ry * Math.sin(rad);
          const player = players.find(p => p.seatIndex === i);
          return (
            <SeatSlot key={i} tableId={table.id} seatIndex={i} cx={cx} cy={cy} player={player} onPlayerClick={onPlayerClick} />
          );
        })}
      </div>

      {/* インライン詳細パネル（展開時） */}
      {expanded && (
        <div className="border-t border-border-light px-5 py-3" onClick={e => e.stopPropagation()}>
          {/* プレイヤーリスト */}
          <div className="mb-3">
            <span className="text-[11px] text-text-tertiary font-semibold uppercase tracking-wider">配置プレイヤー</span>
            {players.length === 0 ? (
              <p className="text-[12px] text-text-tertiary mt-1">プレイヤーなし</p>
            ) : (
              <div className="mt-1 space-y-1">
                {players.map(p => {
                  const displayName = p.nickname || p.name;
                  return (
                  <div key={p.id} className="flex items-center justify-between px-3 py-1.5 rounded-[6px] hover:bg-bg-hover transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                        style={{ backgroundColor: RANK_COLORS[p.rank] }}>
                        {displayName.charAt(0)}
                      </div>
                      <span className="text-[12px] font-medium text-text-primary">{displayName}</span>
                      {p.nickname && <span className="text-[10px] text-text-tertiary">{p.name}</span>}
                      {RANK_LABELS[p.rank] && (
                        <span className="text-[9px] px-1 py-0.5 rounded-[4px] bg-bg-hover text-text-secondary">{RANK_LABELS[p.rank]}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-tertiary">{p.chips.toLocaleString()}枚</span>
                      <button onClick={() => onRemovePlayer(p.id)}
                        className="p-0.5 hover:bg-status-danger-bg rounded text-status-danger">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ディーラー情報 */}
          <div className="flex items-center gap-3 mb-3 text-[12px] text-text-secondary">
            <User className="w-3.5 h-3.5 text-text-tertiary" />
            <span>ディーラー: <strong className="text-text-primary">{table.dealer}</strong></span>
            {table.dealerMinutes > 0 && <span>({table.dealerMinutes}分)</span>}
          </div>

          {/* アクションボタン */}
          <div className="flex gap-2">
            <button onClick={onEdit}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[12px] text-accent bg-accent-light rounded-[6px] hover:bg-[#d0ebe4] transition-colors">
              <Pencil className="w-3 h-3" />編集
            </button>
            <button onClick={onDelete}
              className="flex items-center justify-center gap-1 px-3 py-1.5 text-[12px] text-status-danger bg-status-danger-bg rounded-[6px] hover:bg-[#f8d7d4] transition-colors">
              <Trash2 className="w-3 h-3" />削除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 席スロット（ドロップ対応） ====================
function SeatSlot({ tableId, seatIndex, cx, cy, player, onPlayerClick }: {
  tableId: string; seatIndex: number; cx: number; cy: number; player?: Player;
  onPlayerClick?: (player: Player, event: React.MouseEvent) => void;
}) {
  const seatId = `seat-${tableId}-${seatIndex}`;
  const { setNodeRef, isOver } = useDroppable({ id: seatId });

  return (
    <div
      ref={setNodeRef}
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${cx}%`, top: `${cy}%` }}
    >
      {player ? (
        <DraggablePlayer player={player} onChipClick={onPlayerClick} />
      ) : (
        <div className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center ${
          isOver ? "drop-target-active" : "border-border hover:border-accent/50 hover:bg-[#f0f9f6]"
        }`} style={{ transition: "transform 0.1s, border-color 0.1s, background-color 0.1s" }}>
          <span className={`text-[10px] font-medium ${isOver ? "text-accent" : "text-text-tertiary"}`}>{seatIndex + 1}</span>
        </div>
      )}
    </div>
  );
}

// ==================== 共通 ====================
function TypeBadge({ type }: { type: string }) {
  const c = type === "トナメ" ? "bg-accent-light text-accent" : type === "リング" ? "bg-[#e6f4ea] text-status-success" : "bg-bg-hover text-text-secondary";
  return <span className={`text-[10px] px-1.5 py-0.5 rounded-[4px] font-medium ${c}`}>{type}</span>;
}
