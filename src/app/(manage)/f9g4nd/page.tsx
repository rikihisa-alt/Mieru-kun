"use client";

import { useState, useMemo } from "react";
import { Sparkles, Users, Calendar, Send, Search, Check, X, User } from "lucide-react";

type Target = "selected" | "all" | "vip_gold" | "active_30d";

type Rank = "regular" | "silver" | "gold" | "vip";

interface Customer {
  id: string; nickname: string; name: string; rank: Rank;
}

const CUSTOMERS: Customer[] = [
  { id: "a8f3d9c2", nickname: "タロウ", name: "田中 太郎", rank: "gold" },
  { id: "b4c9d2f1", nickname: "ハナ", name: "鈴木 花子", rank: "vip" },
  { id: "c2e5a9f3", nickname: "ケン", name: "佐藤 健一", rank: "silver" },
  { id: "d1b7f4c8", nickname: "ミィ", name: "高橋 美咲", rank: "regular" },
  { id: "e9a3b2d5", nickname: "ダイ", name: "伊藤 大輔", rank: "regular" },
  { id: "f8d2e4a7", nickname: "ユウ", name: "渡辺 優子", rank: "gold" },
  { id: "7c3f9a2d", nickname: "ショウ", name: "山本 翔太", rank: "silver" },
  { id: "8b5d4e7f", nickname: "アユ", name: "中村 あゆみ", rank: "regular" },
];

const TARGET_LABEL: Record<Target, string> = {
  selected: "個別に選択",
  all: "全会員",
  vip_gold: "VIP / GOLDのみ",
  active_30d: "直近30日来店",
};
const TARGET_COUNT: Record<Target, number> = {
  selected: 0, all: 182, vip_gold: 24, active_30d: 76,
};
const RANK_TEXT: Record<Rank, string> = {
  regular: "text-text-tertiary",
  silver: "text-[#475569]",
  gold: "text-status-warning",
  vip: "text-[#7c3aed]",
};
const RANK_LABEL: Record<Rank, string> = { regular: "Regular", silver: "SILVER", gold: "GOLD", vip: "VIP" };

// ひらがな⇔カタカナ吸収
function normalizeJa(s: string): string {
  return s
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
}

export default function MultikeGrantPage() {
  const [target, setTarget] = useState<Target>("selected"); // 個別をデフォルト
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [amount, setAmount] = useState(5);
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return CUSTOMERS;
    const q = normalizeJa(search.trim());
    return CUSTOMERS.filter(c =>
      normalizeJa(c.nickname).includes(q) || normalizeJa(c.name).includes(q)
    );
  }, [search]);

  const recipientsCount = target === "selected" ? selectedIds.size : TARGET_COUNT[target];
  const totalDistribute = recipientsCount * amount;
  const canSubmit = reason.trim() && recipientsCount > 0 && amount > 0;

  function toggle(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function selectAllVisible() {
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredCustomers.forEach(c => next.add(c.id));
      return next;
    });
  }
  function clearSelection() {
    setSelectedIds(new Set());
  }

  function submit() {
    if (!canSubmit) return;
    setSent(true);
    setTimeout(() => { setSent(false); setSelectedIds(new Set()); setReason(""); }, 2500);
  }

  return (
    <div className="page-stack">
      {/* KPI帯 + 実行ボタン */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-start gap-10 flex-wrap">
            <KpiItem label="対象" value={recipientsCount} unit="名" />
            <KpiItem label="1人あたり" value={amount} unit="枚" />
            <KpiItem label="合計配布" value={totalDistribute.toLocaleString()} unit="枚" accent />
          </div>
          <button
            onClick={submit}
            disabled={!canSubmit || sent}
            className="btn btn-primary"
          >
            <Send className="w-3.5 h-3.5" />
            {sent ? "配布しました" : "配布を実行"}
          </button>
        </div>
      </section>

      {/* 2カラム: 対象 | 詳細 */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* 左: 対象選択 */}
        <div className="glass-panel">
          <div className="flex items-center justify-between mb-3">
            <p className="t-label">配布対象</p>
            {target === "selected" && selectedIds.size > 0 && (
              <button onClick={clearSelection} className="btn btn-ghost btn-xs">
                <X className="w-3 h-3" />選択解除 ({selectedIds.size})
              </button>
            )}
          </div>

          {/* タイプ選択(ピル) */}
          <div className="flex gap-1.5 flex-wrap mb-3">
            {(Object.keys(TARGET_LABEL) as Target[]).map((t) => {
              const active = target === t;
              return (
                <button
                  key={t}
                  onClick={() => setTarget(t)}
                  className={`px-3 py-1.5 rounded-[6px] text-[12px] font-medium border transition-colors flex items-center gap-1.5 ${
                    active ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  {t === "selected" ? <User className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                  {TARGET_LABEL[t]}
                  {t !== "selected" && <span className="opacity-70">({TARGET_COUNT[t]})</span>}
                </button>
              );
            })}
          </div>

          {/* 個別選択UI */}
          {target === "selected" ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="ニックネーム・本名で検索"
                    className="w-full text-[13px]"
                    style={{ paddingLeft: "30px" }}
                  />
                </div>
                <button onClick={selectAllVisible} className="btn btn-subtle btn-sm whitespace-nowrap">
                  表示中を全選択
                </button>
              </div>
              <div className="max-h-[340px] overflow-y-auto scrollbar-subtle border border-border-light rounded-[6px] bg-white/50">
                {filteredCustomers.length === 0 ? (
                  <p className="text-center text-[12px] text-text-tertiary py-6">該当なし</p>
                ) : (
                  filteredCustomers.map(c => {
                    const checked = selectedIds.has(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggle(c.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left border-b border-border-light last:border-b-0 transition-colors ${
                          checked ? "bg-[var(--primary-soft-bg)]" : "hover:bg-bg-hover"
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-[3px] border flex items-center justify-center flex-shrink-0 ${
                          checked ? "bg-accent border-accent" : "border-border bg-white"
                        }`}>
                          {checked && <Check className="w-3 h-3 text-white" />}
                        </span>
                        <span className="text-[13px] font-medium text-text-primary">{c.nickname}</span>
                        <span className="text-[12px] text-text-tertiary">{c.name}</span>
                        <span className={`ml-auto text-[11px] font-semibold tracking-wider ${RANK_TEXT[c.rank]}`}>{RANK_LABEL[c.rank]}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-bg-hover rounded-[6px] text-center">
              <Users className="w-5 h-5 text-text-tertiary mx-auto mb-1.5" />
              <p className="text-[13px] font-medium text-text-primary">{TARGET_LABEL[target]}</p>
              <p className="t-xs text-text-tertiary mt-1">{TARGET_COUNT[target]}名に一斉配布</p>
            </div>
          )}
        </div>

        {/* 右: 詳細 */}
        <div className="glass-panel">
          <p className="t-label mb-3">配布詳細</p>
          <div className="space-y-3">
            <div>
              <label className="block t-xs text-text-secondary mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#7c3aed]" />
                1人あたり枚数
              </label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(parseInt(e.target.value) || 0)}
                className="text-[13px]"
                min={1}
              />
            </div>
            <div>
              <label className="block t-xs text-text-secondary mb-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-text-tertiary" />
                有効期限(任意)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="text-[13px]"
              />
            </div>
            <div>
              <label className="block t-xs text-text-secondary mb-1.5">配布理由 *</label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="例: 春の感謝祭キャンペーン"
                className="text-[13px]"
              />
              <p className="t-xs text-text-tertiary mt-1">会員の履歴画面に表示されます</p>
            </div>
          </div>
        </div>
      </section>
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
