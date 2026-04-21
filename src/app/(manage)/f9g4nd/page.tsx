"use client";

import { useState } from "react";
import { Sparkles, Users, Calendar, Send } from "lucide-react";

type Target = "all" | "vip_gold" | "active_30d" | "selected";

export default function MultikeBulkGrantPage() {
  const [target, setTarget] = useState<Target>("all");
  const [amount, setAmount] = useState(5);
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);

  const TARGET_LABEL: Record<Target, string> = {
    all: "全会員",
    vip_gold: "VIP / GOLDランクのみ",
    active_30d: "直近30日来店あり",
    selected: "個別選択",
  };

  const TARGET_COUNT: Record<Target, number> = {
    all: 182, vip_gold: 24, active_30d: 76, selected: 0,
  };

  function submit() {
    if (!reason.trim()) return;
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  }

  return (
    <div className="page-stack max-w-3xl">
      <div>
        <p className="text-[13px] text-text-secondary mb-4">キャンペーンや施策として、対象会員へマルチケを一括配布します。</p>
      </div>

      <div className="page-stack">
        <div>
          <label className="block t-label mb-2">配布対象</label>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(TARGET_LABEL) as Target[]).map((t) => (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className={`flex items-center justify-between p-3 text-[13px] border rounded-[6px] text-left transition-colors ${
                  target === t ? "border-accent bg-accent-light" : "border-border hover:bg-bg-hover"
                }`}
              >
                <div>
                  <div className="font-medium text-text-primary">{TARGET_LABEL[t]}</div>
                  <div className="text-[11px] text-text-tertiary mt-0.5 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {TARGET_COUNT[t]}名
                  </div>
                </div>
                {target === t && <div className="w-2 h-2 rounded-full bg-accent" />}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block t-label mb-1">1人あたり枚数</label>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#7c3aed]" />
              <input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} />
            </div>
          </div>
          <div>
            <label className="block t-label mb-1">有効期限</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-tertiary" />
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <label className="block t-label mb-1">配布理由（会員画面に表示されます）</label>
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="春の感謝祭 キャンペーン" />
        </div>

        {/* 合計計算 */}
        <div className="p-3 bg-bg-hover rounded-[6px] flex items-center justify-between">
          <span className="text-[12px] text-text-secondary">合計配布枚数</span>
          <span className="text-[18px] font-bold text-[#7c3aed]">
            {(TARGET_COUNT[target] * amount).toLocaleString()} 枚
          </span>
        </div>

        <button onClick={submit} disabled={!reason.trim() || sent} className="w-full py-2.5 bg-[#7c3aed] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#6d2fd0] disabled:opacity-50 flex items-center justify-center gap-2">
          <Send className="w-4 h-4" />
          {sent ? "配布しました" : "一括配布を実行"}
        </button>
      </div>
    </div>
  );
}
