"use client";

import { useState } from "react";
import { Plus, Minus, AlertTriangle } from "lucide-react";

export interface MultikeEntry {
  id: string;
  date: string;
  delta: number;
  reason: string;
  reasonCode: string;
  balanceAfter: number;
  expiresAt?: string;
}

interface Props {
  balance: number;
  thisMonthGained: number;
  expiringSoon: number;
  entries: MultikeEntry[];
  onAdd: (delta: number, reason: string, reasonCode: string, expiresAt?: string) => void;
}

const REASON_PRESETS = [
  { code: "grant", label: "手動付与", sign: 1 },
  { code: "campaign_grant", label: "キャンペーン配布", sign: 1 },
  { code: "use", label: "消化", sign: -1 },
  { code: "manual_adjust", label: "調整", sign: 1 },
  { code: "correction", label: "誤操作修正", sign: -1 },
];

export function MultikePanel({ balance, thisMonthGained, expiringSoon, entries, onAdd }: Props) {
  const [amount, setAmount] = useState("");
  const [selectedCode, setSelectedCode] = useState(REASON_PRESETS[0].code);
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");

  const preset = REASON_PRESETS.find((p) => p.code === selectedCode) ?? REASON_PRESETS[0];

  function submit() {
    const n = parseInt(amount);
    if (!n || isNaN(n)) return;
    const delta = preset.sign * Math.abs(n);
    const reasonText = note.trim() ? `${preset.label}: ${note.trim()}` : preset.label;
    onAdd(delta, reasonText, preset.code, expiresAt || undefined);
    setAmount("");
    setNote("");
    setExpiresAt("");
  }

  return (
    <div className="space-y-4">
      {/* 集計 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#faf8f5] rounded-[6px] p-4">
          <div className="text-[11px] text-[#8e9baa] font-medium mb-1">保有枚数</div>
          <div className="text-[24px] font-bold text-[#2c3e50]">{balance.toLocaleString()}<span className="text-[12px] font-normal text-[#8e9baa] ml-1">枚</span></div>
        </div>
        <div className="bg-[#faf8f5] rounded-[6px] p-4">
          <div className="text-[11px] text-[#8e9baa] font-medium mb-1">今月獲得</div>
          <div className="text-[24px] font-bold text-[#2c3e50]">+{thisMonthGained.toLocaleString()}</div>
        </div>
        <div className={`rounded-[6px] p-4 ${expiringSoon > 0 ? "bg-[#fdf4e8] border border-[#c87b1a]/30" : "bg-[#faf8f5]"}`}>
          <div className="text-[11px] text-[#8e9baa] font-medium mb-1">期限切れ予定(30日以内)</div>
          <div className={`text-[24px] font-bold ${expiringSoon > 0 ? "text-[#c87b1a]" : "text-[#2c3e50]"}`}>
            {expiringSoon > 0 && <AlertTriangle className="w-4 h-4 inline mb-1 mr-1" />}
            {expiringSoon.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 操作 */}
      <div>
        <h3 className="text-[13px] font-semibold text-[#2c3e50] mb-2">操作</h3>
        <div className="flex items-end gap-2 flex-wrap">
          <div className="w-24">
            <label className="block text-[11px] text-[#8e9baa] mb-1">数量</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="例: 5" />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] text-[#8e9baa] mb-1">理由</label>
            <select value={selectedCode} onChange={(e) => setSelectedCode(e.target.value)}>
              {REASON_PRESETS.map((p) => (
                <option key={p.code} value={p.code}>{p.sign > 0 ? "+" : "−"} {p.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-[11px] text-[#8e9baa] mb-1">有効期限（付与時のみ）</label>
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} disabled={preset.sign < 0} />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] text-[#8e9baa] mb-1">補足</label>
            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="キャンペーン名 等" />
          </div>
          <button
            onClick={submit}
            className={`px-4 py-2 text-[13px] font-medium text-white rounded-[6px] whitespace-nowrap ${
              preset.sign > 0 ? "bg-[#7c3aed] hover:bg-[#6d2fd0]" : "bg-[#c0392b] hover:bg-[#9e2b1f]"
            }`}
          >
            {preset.sign > 0 ? <><Plus className="w-3 h-3 inline mr-1" />付与</> : <><Minus className="w-3 h-3 inline mr-1" />消化</>}
          </button>
        </div>
      </div>

      {/* 履歴 */}
      <div>
        <h3 className="text-[13px] font-semibold text-[#2c3e50] mb-2">履歴</h3>
        <div className="space-y-1">
          {entries.length === 0 ? (
            <p className="text-[12px] text-[#8e9baa] py-4 text-center">履歴はありません</p>
          ) : (
            entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-1.5 px-2 text-[12px] rounded hover:bg-[#faf8f5]">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[#8e9baa] font-mono text-[11px] shrink-0">{e.date}</span>
                  <span className={`font-semibold shrink-0 ${e.delta >= 0 ? "text-[#7c3aed]" : "text-[#c0392b]"}`}>
                    {e.delta >= 0 ? "+" : ""}{e.delta.toLocaleString()}
                  </span>
                  <span className="text-[#5a6977] truncate">{e.reason}</span>
                  {e.expiresAt && <span className="text-[10px] text-[#c87b1a] shrink-0">〜{e.expiresAt}</span>}
                </div>
                <span className="text-[#8e9baa] text-[11px] shrink-0">残: {e.balanceAfter.toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
