"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Trophy,
  DollarSign,
  Coins,
  Star,
  Save,
  CheckCircle,
  Plus,
  Gift,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { TipPanel, type TipEntry } from "@/components/customer/tip-panel";
import { MultikePanel, type MultikeEntry } from "@/components/customer/multike-panel";

type Rank = "regular" | "silver" | "gold" | "vip";

const RANK_LABELS: Record<Rank, string> = {
  regular: "Regular",
  silver: "SILVER",
  gold: "GOLD",
  vip: "VIP",
};

function rankTextClass(rank: Rank): string {
  switch (rank) {
    case "gold":
      return "text-status-warning";
    case "vip":
      return "text-[#7c3aed]";
    case "silver":
      return "text-[#475569]";
    default:
      return "text-text-tertiary";
  }
}

interface VisitEntry {
  id: string;
  date: string;
  table: string;
  amount: number;
  stayMinutes: number;
  status: "active" | "settled";
}

interface PrizeEntry {
  id: string;
  date: string;
  name: string;
}

interface UnpaidEntry {
  id: string;
  date: string;
  amount: number;
  note: string;
}

const TABS = ["基本情報", "来店履歴", "リング", "サイド", "マルチケ", "プライズ", "未払"] as const;
type Tab = (typeof TABS)[number];

const PRIZE_OPTIONS = [
  "特製ウイスキー",
  "VIPルーム利用券",
  "フードセット無料券",
  "ドリンク10杯チケット",
  "記念品ギフトセット",
];

// 顧客データ（一覧ページと整合）
interface CustomerData {
  name: string; nickname: string; phone: string; email: string; rank: Rank; notes: string;
  totalVisits: number; totalSpent: number; chipBalance: number; pointBalance: number;
}
const CUSTOMER_DATA: Record<string, CustomerData> = {
  "a8f3d9c2": { name: "田中 太郎", nickname: "タロウ", phone: "090-1234-5678", email: "tanaka@example.com", rank: "gold", notes: "常連客。ウイスキーがお好み。誕生日: 3/15", totalVisits: 25, totalSpent: 150000, chipBalance: 5000, pointBalance: 1200 },
  "b4c9d2f1": { name: "鈴木 花子", nickname: "ハナ", phone: "090-2345-6789", email: "suzuki@example.com", rank: "vip", notes: "VIP常連。カクテル好き。", totalVisits: 50, totalSpent: 350000, chipBalance: 12000, pointBalance: 3500 },
  "c2e5a9f3": { name: "佐藤 健一", nickname: "ケン", phone: "090-3456-7890", email: "sato@example.com", rank: "silver", notes: "", totalVisits: 10, totalSpent: 45000, chipBalance: 2000, pointBalance: 400 },
  "d1b7f4c8": { name: "高橋 美咲", nickname: "ミィ", phone: "", email: "", rank: "regular", notes: "", totalVisits: 3, totalSpent: 12000, chipBalance: 500, pointBalance: 100 },
  "e9a3b2d5": { name: "伊藤 大輔", nickname: "ダイ", phone: "090-4567-8901", email: "", rank: "regular", notes: "", totalVisits: 1, totalSpent: 3000, chipBalance: 0, pointBalance: 50 },
  "f8d2e4a7": { name: "渡辺 優子", nickname: "ユウ", phone: "090-5678-9012", email: "watanabe@example.com", rank: "gold", notes: "", totalVisits: 30, totalSpent: 200000, chipBalance: 8000, pointBalance: 2000 },
  "7c3f9a2d": { name: "山本 翔太", nickname: "ショウ", phone: "", email: "", rank: "silver", notes: "", totalVisits: 8, totalSpent: 32000, chipBalance: 1500, pointBalance: 300 },
  "8b5d4e7f": { name: "中村 あゆみ", nickname: "アユ", phone: "090-6789-0123", email: "", rank: "regular", notes: "", totalVisits: 2, totalSpent: 8000, chipBalance: 200, pointBalance: 80 },
};

const DEFAULT_CUSTOMER: CustomerData = { name: "顧客", nickname: "", phone: "", email: "", rank: "regular", notes: "", totalVisits: 0, totalSpent: 0, chipBalance: 0, pointBalance: 0 };

export default function CustomerDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const initial = CUSTOMER_DATA[id] ?? DEFAULT_CUSTOMER;

  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: Tab =
    tabParam === "ring" || tabParam === "chip" ? "リング"
    : tabParam === "side" ? "サイド"
    : tabParam === "multike" ? "マルチケ"
    : tabParam === "visit" ? "来店履歴"
    : tabParam === "prize" ? "プライズ"
    : tabParam === "unpaid" ? "未払"
    : "基本情報";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Basic info state
  const [name, setName] = useState(initial.name);
  const [nickname, setNickname] = useState(initial.nickname);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [rank, setRank] = useState<Rank>(initial.rank);
  const [notes, setNotes] = useState(initial.notes);

  // Phase 1 拡張: 注意事項・管理フラグ
  const [cautionText, setCautionText] = useState("");
  const [isBlacklisted, setIsBlacklisted] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [lineId, setLineId] = useState("");
  const [saveMsg, setSaveMsg] = useState(false);

  // Stats
  const [visits] = useState(initial.totalVisits);
  const [totalSpent] = useState(initial.totalSpent);
  const [pointBalance] = useState(initial.pointBalance);

  // Visit history
  const [visitHistory] = useState<VisitEntry[]>([
    { id: "vh1", date: "2026-04-11 20:30", table: "VIP-1", amount: 32000, stayMinutes: 180, status: "settled" },
    { id: "vh2", date: "2026-04-09 19:00", table: "A-2", amount: 15000, stayMinutes: 120, status: "settled" },
    { id: "vh3", date: "2026-04-05 21:15", table: "VIP-2", amount: 48000, stayMinutes: 240, status: "settled" },
    { id: "vh4", date: "2026-04-01 18:45", table: "B-1", amount: 22000, stayMinutes: 150, status: "settled" },
    { id: "vh5", date: "2026-03-28 20:00", table: "VIP-1", amount: 38000, stayMinutes: 210, status: "settled" },
  ]);

  // Prize
  const [prizes, setPrizes] = useState<PrizeEntry[]>([
    { id: "pr1", date: "2026-04-10", name: "特製ウイスキー" },
    { id: "pr2", date: "2026-03-25", name: "VIPルーム利用券" },
    { id: "pr3", date: "2026-03-10", name: "フードセット無料券" },
  ]);
  const [showPrizeForm, setShowPrizeForm] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState(PRIZE_OPTIONS[0]);

  // Unpaid
  const [hasUnpaid, setHasUnpaid] = useState(false);
  const [unpaidAmount, setUnpaidAmount] = useState("");
  const [unpaidHistory] = useState<UnpaidEntry[]>([
    { id: "up1", date: "2026-03-15", amount: 5000, note: "精算忘れ - 翌日回収済" },
  ]);

  function handleSave() {
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 2000);
  }

  function handlePrizeGrant() {
    setPrizes((prev) => [
      { id: `pr${Date.now()}`, date: new Date().toISOString().split("T")[0], name: selectedPrize },
      ...prev,
    ]);
    setShowPrizeForm(false);
    setSelectedPrize(PRIZE_OPTIONS[0]);
  }

  // ---- Phase 2: リング / サイド / マルチケ（デモstate）----
  const initialRingBal = Math.floor(initial.chipBalance * 0.7);
  const initialSideBal = initial.chipBalance - initialRingBal;
  const [ringBalance, setRingBalance] = useState(initialRingBal);
  const [sideBalance, setSideBalance] = useState(initialSideBal);
  const [ringFrozen, setRingFrozen] = useState(false);
  const [sideFrozen, setSideFrozen] = useState(false);
  const [ringEntries, setRingEntries] = useState<TipEntry[]>([
    { id: "r1", date: "2026-04-17", delta: 2000, reason: "来店ボーナス", reasonCode: "visit_bonus", balanceAfter: initialRingBal, performedBy: "山田" },
    { id: "r2", date: "2026-04-15", delta: -1500, reason: "リング利用", reasonCode: "ring_play", balanceAfter: initialRingBal - 2000, performedBy: "鈴木" },
  ]);
  const [sideEntries, setSideEntries] = useState<TipEntry[]>([
    { id: "s1", date: "2026-04-14", delta: 1000, reason: "サイド購入", reasonCode: "purchase", balanceAfter: initialSideBal, performedBy: "山田" },
  ]);
  const [multikeBalance, setMultikeBalance] = useState(12);
  const [multikeEntries, setMultikeEntries] = useState<MultikeEntry[]>([
    { id: "m1", date: "2026-04-10", delta: 5, reason: "キャンペーン配布: 春の感謝祭", reasonCode: "campaign_grant", balanceAfter: 12, expiresAt: "2026-06-30" },
    { id: "m2", date: "2026-04-05", delta: 3, reason: "手動付与", reasonCode: "grant", balanceAfter: 7, expiresAt: "2026-05-30" },
    { id: "m3", date: "2026-04-01", delta: -2, reason: "消化", reasonCode: "use", balanceAfter: 4 },
  ]);

  function addRingEntry(delta: number, reason: string, reasonCode: string) {
    const newBal = ringBalance + delta;
    setRingBalance(newBal);
    setRingEntries((prev) => [
      { id: `r${Date.now()}`, date: new Date().toISOString().split("T")[0], delta, reason, reasonCode, balanceAfter: newBal, performedBy: "自分" },
      ...prev,
    ]);
  }
  function addSideEntry(delta: number, reason: string, reasonCode: string) {
    const newBal = sideBalance + delta;
    setSideBalance(newBal);
    setSideEntries((prev) => [
      { id: `s${Date.now()}`, date: new Date().toISOString().split("T")[0], delta, reason, reasonCode, balanceAfter: newBal, performedBy: "自分" },
      ...prev,
    ]);
  }
  function transferRingToSide(amount: number) {
    if (amount > ringBalance) return;
    addRingEntry(-amount, "サイドへ移行", "transfer_out");
    addSideEntry(amount, "リングから移行", "transfer_in");
  }
  function transferSideToRing(amount: number) {
    if (amount > sideBalance) return;
    addSideEntry(-amount, "リングへ移行", "transfer_out");
    addRingEntry(amount, "サイドから移行", "transfer_in");
  }
  function addMultikeEntry(delta: number, reason: string, reasonCode: string, expiresAt?: string) {
    const newBal = multikeBalance + delta;
    setMultikeBalance(newBal);
    setMultikeEntries((prev) => [
      { id: `m${Date.now()}`, date: new Date().toISOString().split("T")[0], delta, reason, reasonCode, balanceAfter: newBal, expiresAt },
      ...prev,
    ]);
  }

  const multikeThisMonthGained = multikeEntries.filter((e) => e.delta > 0 && e.date.startsWith("2026-04")).reduce((s, e) => s + e.delta, 0);
  const multikeExpiringSoon = multikeEntries
    .filter((e) => e.delta > 0 && e.expiresAt)
    .filter((e) => {
      if (!e.expiresAt) return false;
      const d = new Date(e.expiresAt);
      const now = new Date();
      return d.getTime() - now.getTime() <= 30 * 24 * 60 * 60 * 1000;
    })
    .reduce((s, e) => s + e.delta, 0);

  const stats = [
    { icon: <Trophy className="w-4 h-4" />, label: "来店回数", value: `${visits}回` },
    { icon: <DollarSign className="w-4 h-4" />, label: "累計利用額", value: `¥${totalSpent.toLocaleString()}` },
    { icon: <Coins className="w-4 h-4" />, label: "リング", value: ringBalance.toLocaleString() },
    { icon: <Coins className="w-4 h-4" />, label: "サイド", value: sideBalance.toLocaleString() },
    { icon: <Sparkles className="w-4 h-4" />, label: "マルチケ", value: multikeBalance.toLocaleString() },
    { icon: <Star className="w-4 h-4" />, label: "ポイント", value: pointBalance.toLocaleString() },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Back link */}
      <Link
        href="/a9k5dm"
        className="inline-flex items-center gap-1 text-[13px] text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        顧客一覧
      </Link>

      {/* Customer header */}
      <div className="pb-4 border-b border-border-light">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <h1 className="text-[18px] font-bold text-text-primary">{nickname || name}</h1>
              {nickname && <span className="text-[13px] text-text-tertiary">{name}</span>}
              <span className={`text-[12px] font-semibold tracking-wider ${rankTextClass(rank)}`}>
                {RANK_LABELS[rank]}
              </span>
              {isBlacklisted && (
                <span className="text-[11px] font-bold tracking-wider text-status-danger border border-[#c5221f]/40 bg-status-danger-bg px-1.5 py-0.5 rounded-[4px]">BLACK</span>
              )}
              {isHidden && (
                <span className="text-[11px] font-semibold tracking-wider text-text-secondary border border-border bg-bg-hover px-1.5 py-0.5 rounded-[4px]">HIDDEN</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[13px] text-text-secondary">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-text-tertiary" />
                {phone || "-"}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-text-tertiary" />
                {email || "-"}
              </span>
            </div>
            {cautionText && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-status-warning-bg border border-[#c87b1a]/30 rounded-[6px]">
                <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
                <span className="text-[12px] text-[#8a5a10] leading-relaxed">{cautionText}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-6">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className="text-text-tertiary text-[13px]">{s.label}</span>
            <span className="text-[15px] font-bold text-text-primary">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div>
        <div className="tabs-underline mb-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-underline ${activeTab === tab ? "tab-underline-active" : ""}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="glass-panel">
          {/* Tab 1: Basic Info */}
          {activeTab === "基本情報" && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block t-label mb-1">ニックネーム（ポーカーネーム）</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="卓上・精算等の画面で表示される名前"
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-[6px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-[#3a8f7c]"
                />
              </div>
              <div>
                <label className="block t-label mb-1">本名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-[6px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-[#3a8f7c]"
                />
              </div>
              <div>
                <label className="block t-label mb-1">電話番号</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-[6px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-[#3a8f7c]"
                />
              </div>
              <div>
                <label className="block t-label mb-1">メールアドレス</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-[6px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-[#3a8f7c]"
                />
              </div>
              <div>
                <label className="block t-label mb-1">ランク</label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value as Rank)}
                  className="w-full px-3 py-2 text-[13px] bg-[#ffffff] border border-border rounded-[6px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-[#3a8f7c]"
                >
                  <option value="regular">レギュラー</option>
                  <option value="silver">シルバー</option>
                  <option value="gold">ゴールド</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div>
                <label className="block t-label mb-1">生年月日</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-[6px] text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block t-label mb-1">LINE ID</label>
                <input
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="LINE連携ID"
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-[6px] text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block t-label mb-1">注意事項（ヘッダー常時表示）</label>
                <textarea
                  value={cautionText}
                  onChange={(e) => setCautionText(e.target.value)}
                  rows={2}
                  placeholder="例: 飲食不可 / 過去トラブルあり"
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-[6px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-[#3a8f7c] resize-none"
                />
              </div>
              <div>
                <label className="block t-label mb-1">備考（一般メモ）</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-[13px] border border-border rounded-[6px] text-text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-[#3a8f7c] resize-none"
                />
              </div>
              <div className="pt-2 border-t border-border-light space-y-2">
                <p className="t-label mb-1">管理フラグ</p>
                <label className="flex items-center gap-2 text-[13px] text-text-primary cursor-pointer">
                  <input type="checkbox" checked={isBlacklisted} onChange={(e) => setIsBlacklisted(e.target.checked)} />
                  <span>ブラックリスト（入店拒否）</span>
                  <span className="text-[11px] text-text-tertiary">※ オーナーのみ変更可</span>
                </label>
                <label className="flex items-center gap-2 text-[13px] text-text-primary cursor-pointer">
                  <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} />
                  <span>非表示（一般スタッフの検索結果に出さない）</span>
                </label>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-[#ffffff] bg-accent hover:bg-accent-hover rounded-[6px] transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存
                </button>
                {saveMsg && (
                  <span className="flex items-center gap-1 text-[12px] text-status-success">
                    <CheckCircle className="w-3.5 h-3.5" />
                    保存しました
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Visit History */}
          {activeTab === "来店履歴" && (
            <div>
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border-light">
                    <th className="px-3 py-2 data-th">日時</th>
                    <th className="px-3 py-2 data-th">卓</th>
                    <th className="px-3 py-2 data-th">金額</th>
                    <th className="px-3 py-2 data-th">滞在時間</th>
                    <th className="px-3 py-2 data-th">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {visitHistory.map((v) => {
                    const h = Math.floor(v.stayMinutes / 60);
                    const m = v.stayMinutes % 60;
                    const stayStr = h > 0 ? `${h}時間${m}分` : `${m}分`;
                    return (
                      <tr key={v.id} className="border-b border-border-light hover:bg-bg-hover cursor-pointer transition-colors">
                        <td className="px-3 py-2.5 text-text-secondary">{v.date}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block px-2 py-0.5 bg-bg-hover rounded-[4px] text-[12px] font-medium">
                            {v.table}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-text-primary">¥{v.amount.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-text-secondary">{stayStr}</td>
                        <td className="px-3 py-2.5">
                          <span className="chip chip-accent">
                            精算済
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3a: リングチップ */}
          {activeTab === "リング" && (
            <TipPanel
              kind="ring"
              label="リング"
              balance={ringBalance}
              entries={ringEntries}
              onAdd={addRingEntry}
              onTransfer={transferRingToSide}
              frozen={ringFrozen}
              onToggleFreeze={() => setRingFrozen((v) => !v)}
            />
          )}

          {/* Tab 3b: サイドチップ */}
          {activeTab === "サイド" && (
            <TipPanel
              kind="side"
              label="サイド"
              balance={sideBalance}
              entries={sideEntries}
              onAdd={addSideEntry}
              onTransfer={transferSideToRing}
              frozen={sideFrozen}
              onToggleFreeze={() => setSideFrozen((v) => !v)}
            />
          )}

          {/* Tab 3c: マルチケ */}
          {activeTab === "マルチケ" && (
            <MultikePanel
              balance={multikeBalance}
              thisMonthGained={multikeThisMonthGained}
              expiringSoon={multikeExpiringSoon}
              entries={multikeEntries}
              onAdd={addMultikeEntry}
            />
          )}

          {/* Tab 4: Prizes */}
          {activeTab === "プライズ" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="t-subhead">付与済みプライズ</h3>
                {!showPrizeForm && (
                  <button
                    onClick={() => setShowPrizeForm(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-[#ffffff] bg-accent hover:bg-accent-hover rounded-[6px] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    プライズ付与
                  </button>
                )}
              </div>

              {showPrizeForm && (
                <div className="flex items-end gap-2 p-3 bg-bg-hover rounded-[6px]">
                  <div className="flex-1">
                    <label className="block text-[11px] text-text-tertiary mb-1">プライズ選択</label>
                    <select
                      value={selectedPrize}
                      onChange={(e) => setSelectedPrize(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] bg-[#ffffff] border border-border rounded-[6px] text-text-primary focus:outline-none focus:border-accent"
                    >
                      {PRIZE_OPTIONS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={handlePrizeGrant}
                    className="px-4 py-2 text-[13px] font-medium text-[#ffffff] bg-accent hover:bg-accent-hover rounded-[6px] transition-colors whitespace-nowrap"
                  >
                    付与
                  </button>
                  <button
                    onClick={() => setShowPrizeForm(false)}
                    className="px-3 py-2 text-[12px] text-text-secondary hover:text-text-primary"
                  >
                    キャンセル
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {prizes.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border-light hover:bg-bg-hover transition-colors">
                    <Gift className="w-4 h-4 text-[#7c3aed]" />
                    <span className="text-[13px] font-medium text-text-primary">{p.name}</span>
                    <span className="text-[12px] text-text-tertiary ml-auto">{p.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 5: Unpaid */}
          {activeTab === "未払" && (
            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center gap-3">
                <span className="text-[13px] text-text-primary">未払あり</span>
                <button
                  onClick={() => setHasUnpaid(!hasUnpaid)}
                  className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                    hasUnpaid ? "bg-status-danger" : "bg-[#d8d3cc]"
                  }`}
                >
                  <span
                    className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-[#ffffff] shadow transition-transform ${
                      hasUnpaid ? "left-[22px]" : "left-[2px]"
                    }`}
                  />
                </button>
              </div>

              {hasUnpaid && (
                <div className="p-4 bg-status-danger-bg border border-[#c5221f]/20 rounded-[6px]">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-status-danger" />
                    <span className="text-[13px] font-medium text-status-danger">未払いが発生しています</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-status-danger/70 mb-1">未払金額</label>
                    <input
                      type="number"
                      value={unpaidAmount}
                      onChange={(e) => setUnpaidAmount(e.target.value)}
                      placeholder="金額を入力"
                      className="w-full max-w-[200px] px-3 py-2 text-[13px] border border-[#c5221f]/30 rounded-[6px] text-text-primary focus:outline-none focus:border-[#c5221f] bg-[#ffffff]"
                    />
                  </div>
                </div>
              )}

              {/* Unpaid history */}
              <div>
                <h3 className="t-subhead mb-2">未払履歴</h3>
                <div className="space-y-2">
                  {unpaidHistory.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-3 py-2.5 border-b border-border-light">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] text-text-tertiary">{u.date}</span>
                        <span className="text-[13px] font-medium text-status-danger">¥{u.amount.toLocaleString()}</span>
                        <span className="text-[12px] text-text-secondary">{u.note}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
