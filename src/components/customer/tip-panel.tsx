"use client";

import { useState } from "react";
import { ArrowRightLeft, Lock, Unlock, Plus, Minus } from "lucide-react";

export interface TipEntry {
  id: string;
  date: string;
  delta: number;
  reason: string;
  reasonCode: string;
  balanceAfter: number;
  performedBy?: string;
}

interface Props {
  kind: "ring" | "side";
  label: string;
  balance: number;
  entries: TipEntry[];
  onAdd: (delta: number, reason: string, reasonCode: string) => void;
  onTransfer?: (amount: number) => void; // 他種別へ移行
  frozen?: boolean;
  onToggleFreeze?: () => void;
}

const REASON_PRESETS: Record<string, { code: string; label: string; sign: 1 | -1 }[]> = {
  ring: [
    { code: "visit_bonus", label: "来店ボーナス", sign: 1 },
    { code: "event_prize", label: "イベント賞品", sign: 1 },
    { code: "purchase", label: "チップ購入", sign: 1 },
    { code: "ring_play", label: "リング利用", sign: -1 },
    { code: "withdraw", label: "引出", sign: -1 },
    { code: "manual_adjust", label: "手動調整", sign: 1 },
    { code: "correction", label: "誤操作修正", sign: -1 },
  ],
  side: [
    { code: "event_prize", label: "イベント賞品", sign: 1 },
    { code: "purchase", label: "サイド購入", sign: 1 },
    { code: "side_play", label: "サイド利用", sign: -1 },
    { code: "withdraw", label: "引出", sign: -1 },
    { code: "manual_adjust", label: "手動調整", sign: 1 },
    { code: "correction", label: "誤操作修正", sign: -1 },
  ],
};

export function TipPanel({ kind, label, balance, entries, onAdd, onTransfer, frozen, onToggleFreeze }: Props) {
  const [amount, setAmount] = useState("");
  const [selectedCode, setSelectedCode] = useState(REASON_PRESETS[kind][0].code);
  const [freeNote, setFreeNote] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferAmount, setTransferAmount] = useState("");

  const preset = REASON_PRESETS[kind].find((p) => p.code === selectedCode) ?? REASON_PRESETS[kind][0];

  function submit() {
    const n = parseInt(amount);
    if (!n || isNaN(n)) return;
    const delta = preset.sign * Math.abs(n);
    const reasonText = freeNote.trim() ? `${preset.label}: ${freeNote.trim()}` : preset.label;
    onAdd(delta, reasonText, preset.code);
    setAmount("");
    setFreeNote("");
  }

  function submitTransfer() {
    const n = parseInt(transferAmount);
    if (!n || isNaN(n) || !onTransfer) return;
    onTransfer(Math.abs(n));
    setTransferAmount("");
    setShowTransfer(false);
  }

  return (
    <div className="space-y-4">
      {/* 残高カード + 凍結トグル + 移行 */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-bg-hover rounded-[6px] p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-text-tertiary font-medium">{label}残高</span>
            {frozen && (
              <span className="text-[10px] font-bold tracking-wider text-status-danger bg-status-danger-bg px-1.5 py-0.5 rounded-[3px]">
                FROZEN
              </span>
            )}
          </div>
          <div className="text-[24px] font-bold text-text-primary">{balance.toLocaleString()}<span className="text-[12px] font-normal text-text-tertiary ml-1">枚</span></div>
        </div>
        <div className="flex flex-col gap-1">
          {onToggleFreeze && (
            <button onClick={onToggleFreeze} className="flex items-center gap-1 px-2 py-1 text-[11px] text-text-secondary hover:bg-bg-hover rounded-[4px]">
              {frozen ? <><Unlock className="w-3 h-3" />解凍</> : <><Lock className="w-3 h-3" />凍結</>}
            </button>
          )}
          {onTransfer && (
            <button onClick={() => setShowTransfer((v) => !v)} className="flex items-center gap-1 px-2 py-1 text-[11px] text-text-secondary hover:bg-bg-hover rounded-[4px]">
              <ArrowRightLeft className="w-3 h-3" />移行
            </button>
          )}
        </div>
      </div>

      {/* 移行フォーム */}
      {showTransfer && onTransfer && (
        <div className="flex items-end gap-2 p-3 bg-bg-hover rounded-[6px]">
          <div className="flex-1">
            <label className="block text-[11px] text-text-secondary mb-1">
              {kind === "ring" ? "リング → サイド" : "サイド → リング"} 移行数量
            </label>
            <input
              type="number"
              value={transferAmount}
              onChange={(e) => setTransferAmount(e.target.value)}
              placeholder="枚数"
              className="w-full px-3 py-2 text-[13px]"
            />
          </div>
          <button onClick={submitTransfer} className="px-3 py-2 text-[12px] bg-accent text-white rounded-[6px] hover:bg-accent-hover">
            実行
          </button>
          <button onClick={() => setShowTransfer(false)} className="px-3 py-2 text-[12px] text-text-secondary">
            取消
          </button>
        </div>
      )}

      {/* 付与/消費フォーム */}
      <div>
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">操作</h3>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="w-28">
            <label className="block text-[11px] text-text-tertiary mb-1">数量</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="例: 500" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] text-text-tertiary mb-1">理由</label>
            <select value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)}>
              {REASON_PRESETS[kind].map((p) => (
                <option key={p.code} value={p.code}>{p.sign > 0 ? "+" : "−"} {p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] text-text-tertiary mb-1">補足（任意）</label>
            <input type="text" value={freeNote} onChange={(e) => setFreeNote(e.target.value)} placeholder="詳細" />
          </div>
          <button
            onClick={submit}
            disabled={frozen}
            className={`px-4 py-2 text-[13px] font-medium text-white rounded-[6px] whitespace-nowrap ${
              frozen ? "bg-[#d8d3cc] cursor-not-allowed" : preset.sign > 0 ? "bg-accent hover:bg-accent-hover" : "bg-status-danger hover:bg-[#9e2b1f]"
            }`}
          >
            {preset.sign > 0 ? <><Plus className="w-3 h-3 inline mr-1" />付与</> : <><Minus className="w-3 h-3 inline mr-1" />消費</>}
          </button>
        </div>
      </div>

      {/* 履歴 */}
      <div>
        <h3 className="text-[13px] font-semibold text-text-primary mb-2">履歴</h3>
        <div className="space-y-1">
          {entries.length === 0 ? (
            <p className="text-[12px] text-text-tertiary py-4 text-center">履歴はありません</p>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-1.5 px-2 text-[12px] rounded hover:bg-bg-hover">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-text-tertiary font-mono text-[11px] shrink-0">{e.date}</span>
                  <span className={`font-semibold shrink-0 ${e.delta >= 0 ? "text-status-success" : "text-status-danger"}`}>
                    {e.delta >= 0 ? "+" : ""}{e.delta.toLocaleString()}
                  </span>
                  <span className="text-text-secondary truncate">{e.reason}</span>
                  {e.performedBy && <span className="text-[10px] text-text-tertiary shrink-0">by {e.performedBy}</span>}
                </div>
                <span className="text-text-tertiary text-[11px] shrink-0">残: {e.balanceAfter.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
