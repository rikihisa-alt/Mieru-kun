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

  const totalDistribute = TARGET_COUNT[target] * amount;

  return (
    <div className="page-stack max-w-3xl">
      {/* KPI */}
      <section>
        <div className="flex items-end gap-8 flex-wrap">
          <KpiItem label="対象" value={TARGET_COUNT[target]} unit="名" />
          <KpiItem label="1人あたり" value={amount} unit="枚" />
          <KpiItem label="合計配布" value={totalDistribute.toLocaleString()} unit="枚" accent />
        </div>
      </section>

      {/* 配布対象 */}
      <section className="glass-panel">
        <p className="t-label mb-3">配布対象</p>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(TARGET_LABEL) as Target[]).map((t) => {
            const active = target === t;
            return (
              <button
                key={t}
                onClick={() => setTarget(t)}
                className="flex items-center justify-between p-4 rounded-[var(--radius)] text-left transition-all"
                style={{
                  background: active ? "var(--primary-soft-bg)" : "rgba(255,255,255,0.45)",
                  border: active ? "1px solid rgba(32,156,110,0.3)" : "1px solid var(--border-light)",
                  backdropFilter: "blur(8px)",
                }}
              >
                <div>
                  <div className={`font-medium ${active ? "text-[color:var(--primary-text)]" : "text-text-primary"}`}>{TARGET_LABEL[t]}</div>
                  <div className="t-xs text-text-tertiary mt-1 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {TARGET_COUNT[t]}名
                  </div>
                </div>
                {active && <div className="w-2 h-2 rounded-full bg-[color:var(--primary-solid)]" />}
              </button>
            );
          })}
        </div>
      </section>

      {/* 詳細設定 */}
      <section className="glass-panel">
        <p className="t-label mb-4">配布詳細</p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block t-xs text-text-secondary mb-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#7c3aed]" />
                1人あたり枚数
              </label>
              <input type="number" value={amount} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block t-xs text-text-secondary mb-2 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-text-tertiary" />
                有効期限
              </label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="block t-xs text-text-secondary mb-2">配布理由（会員画面に表示されます）</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="春の感謝祭 キャンペーン" />
          </div>
        </div>
      </section>

      {/* 実行 */}
      <button
        onClick={submit}
        disabled={!reason.trim() || sent}
        className="btn btn-primary w-full justify-center py-3"
        style={{ background: sent ? "var(--success-soft-bg)" : undefined }}
      >
        <Send className="w-4 h-4" />
        {sent ? "配布しました" : "一括配布を実行"}
      </button>
    </div>
  );
}

function KpiItem({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value" style={{ color: accent ? "var(--primary-text)" : "var(--text-primary)" }}>{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
    </div>
  );
}
