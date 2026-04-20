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
} from "lucide-react";

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
      return "text-[#d97706]";
    case "vip":
      return "text-[#7c3aed]";
    case "silver":
      return "text-[#475569]";
    default:
      return "text-[#8e9baa]";
  }
}

interface ChipPointEntry {
  id: string;
  date: string;
  amount: number;
  reason: string;
  balanceAfter: number;
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

const TABS = ["基本情報", "来店履歴", "チップ・ポイント", "プライズ", "未払"] as const;
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
    tabParam === "chip" ? "チップ・ポイント"
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
  const [chipBalance, setChipBalance] = useState(initial.chipBalance);
  const [pointBalance, setPointBalance] = useState(initial.pointBalance);

  // Visit history
  const [visitHistory] = useState<VisitEntry[]>([
    { id: "vh1", date: "2026-04-11 20:30", table: "VIP-1", amount: 32000, stayMinutes: 180, status: "settled" },
    { id: "vh2", date: "2026-04-09 19:00", table: "A-2", amount: 15000, stayMinutes: 120, status: "settled" },
    { id: "vh3", date: "2026-04-05 21:15", table: "VIP-2", amount: 48000, stayMinutes: 240, status: "settled" },
    { id: "vh4", date: "2026-04-01 18:45", table: "B-1", amount: 22000, stayMinutes: 150, status: "settled" },
    { id: "vh5", date: "2026-03-28 20:00", table: "VIP-1", amount: 38000, stayMinutes: 210, status: "settled" },
  ]);

  // Chip history
  const [chipHistory, setChipHistory] = useState<ChipPointEntry[]>([
    { id: "ch1", date: "2026-04-11", amount: 2000, reason: "来店ボーナス", balanceAfter: 5000 },
    { id: "ch2", date: "2026-04-09", amount: -500, reason: "ドリンク交換", balanceAfter: 3000 },
    { id: "ch3", date: "2026-04-05", amount: 1000, reason: "イベント参加", balanceAfter: 3500 },
    { id: "ch4", date: "2026-04-01", amount: 1500, reason: "VIPボーナス", balanceAfter: 2500 },
    { id: "ch5", date: "2026-03-28", amount: -200, reason: "景品交換", balanceAfter: 1000 },
  ]);
  const [chipAmount, setChipAmount] = useState("");
  const [chipReason, setChipReason] = useState("");

  // Point history
  const [pointHistory, setPointHistory] = useState<ChipPointEntry[]>([
    { id: "ph1", date: "2026-04-11", amount: 320, reason: "利用額ポイント", balanceAfter: 1200 },
    { id: "ph2", date: "2026-04-09", amount: 150, reason: "利用額ポイント", balanceAfter: 880 },
    { id: "ph3", date: "2026-04-05", amount: -300, reason: "景品交換", balanceAfter: 730 },
    { id: "ph4", date: "2026-04-01", amount: 220, reason: "利用額ポイント", balanceAfter: 1030 },
    { id: "ph5", date: "2026-03-28", amount: 380, reason: "利用額ポイント", balanceAfter: 810 },
  ]);
  const [pointAmount, setPointAmount] = useState("");
  const [pointReason, setPointReason] = useState("");

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
  const [unpaidHistory, setUnpaidHistory] = useState<UnpaidEntry[]>([
    { id: "up1", date: "2026-03-15", amount: 5000, note: "精算忘れ - 翌日回収済" },
  ]);

  function handleSave() {
    setSaveMsg(true);
    setTimeout(() => setSaveMsg(false), 2000);
  }

  function handleChipGrant() {
    const amt = parseInt(chipAmount);
    if (isNaN(amt) || amt === 0 || !chipReason.trim()) return;
    const newBalance = chipBalance + amt;
    setChipBalance(newBalance);
    setChipHistory((prev) => [
      { id: `ch${Date.now()}`, date: new Date().toISOString().split("T")[0], amount: amt, reason: chipReason, balanceAfter: newBalance },
      ...prev,
    ]);
    setChipAmount("");
    setChipReason("");
  }

  function handlePointGrant() {
    const amt = parseInt(pointAmount);
    if (isNaN(amt) || amt === 0 || !pointReason.trim()) return;
    const newBalance = pointBalance + amt;
    setPointBalance(newBalance);
    setPointHistory((prev) => [
      { id: `ph${Date.now()}`, date: new Date().toISOString().split("T")[0], amount: amt, reason: pointReason, balanceAfter: newBalance },
      ...prev,
    ]);
    setPointAmount("");
    setPointReason("");
  }

  function handlePrizeGrant() {
    setPrizes((prev) => [
      { id: `pr${Date.now()}`, date: new Date().toISOString().split("T")[0], name: selectedPrize },
      ...prev,
    ]);
    setShowPrizeForm(false);
    setSelectedPrize(PRIZE_OPTIONS[0]);
  }

  const stats = [
    { icon: <Trophy className="w-4 h-4" />, label: "来店回数", value: `${visits}回` },
    { icon: <DollarSign className="w-4 h-4" />, label: "累計利用額", value: `¥${totalSpent.toLocaleString()}` },
    { icon: <Coins className="w-4 h-4" />, label: "チップ残高", value: chipBalance.toLocaleString() },
    { icon: <Star className="w-4 h-4" />, label: "ポイント残高", value: pointBalance.toLocaleString() },
  ];

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Back link */}
      <Link
        href="/a9k5dm"
        className="inline-flex items-center gap-1 text-[13px] text-[#5a6977] hover:text-[#2c3e50] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        顧客一覧
      </Link>

      {/* Customer header */}
      <div className="pb-4 border-b border-[#e8e4df]">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-baseline gap-2 mb-1 flex-wrap">
              <h1 className="text-[18px] font-bold text-[#2c3e50]">{nickname || name}</h1>
              {nickname && <span className="text-[13px] text-[#8e9baa]">{name}</span>}
              <span className={`text-[12px] font-semibold tracking-wider ${rankTextClass(rank)}`}>
                {RANK_LABELS[rank]}
              </span>
              {isBlacklisted && (
                <span className="text-[11px] font-bold tracking-wider text-[#c5221f] border border-[#c5221f]/40 bg-[#fce8e6] px-1.5 py-0.5 rounded-[4px]">BLACK</span>
              )}
              {isHidden && (
                <span className="text-[11px] font-semibold tracking-wider text-[#5a6977] border border-[#d8d3cc] bg-[#f3f0ec] px-1.5 py-0.5 rounded-[4px]">HIDDEN</span>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 text-[13px] text-[#5a6977]">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#8e9baa]" />
                {phone || "-"}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-[#8e9baa]" />
                {email || "-"}
              </span>
            </div>
            {cautionText && (
              <div className="mt-3 flex items-start gap-2 px-3 py-2 bg-[#fdf4e8] border border-[#c87b1a]/30 rounded-[6px]">
                <AlertTriangle className="w-4 h-4 text-[#c87b1a] shrink-0 mt-0.5" />
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
            <span className="text-[#8e9baa] text-[13px]">{s.label}</span>
            <span className="text-[15px] font-bold text-[#2c3e50]">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-[#e8e4df] mb-4">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-[13px] font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? "text-[#3a8f7c] border-[#3a8f7c]"
                  : "text-[#8e9baa] border-transparent hover:text-[#2c3e50]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div>
          {/* Tab 1: Basic Info */}
          {activeTab === "基本情報" && (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1">ニックネーム（ポーカーネーム）</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="卓上・精算等の画面で表示される名前"
                  className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1">本名</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1">電話番号</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1">メールアドレス</label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1">ランク</label>
                <select
                  value={rank}
                  onChange={(e) => setRank(e.target.value as Rank)}
                  className="w-full px-3 py-2 text-[13px] bg-[#ffffff] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                >
                  <option value="regular">レギュラー</option>
                  <option value="silver">シルバー</option>
                  <option value="gold">ゴールド</option>
                  <option value="vip">VIP</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1">生年月日</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1">LINE ID</label>
                <input
                  type="text"
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  placeholder="LINE連携ID"
                  className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1">注意事項（ヘッダー常時表示）</label>
                <textarea
                  value={cautionText}
                  onChange={(e) => setCautionText(e.target.value)}
                  rows={2}
                  placeholder="例: 飲食不可 / 過去トラブルあり"
                  className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c] resize-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1">備考（一般メモ）</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c] resize-none"
                />
              </div>
              <div className="pt-2 border-t border-[#e8e4df] space-y-2">
                <p className="text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1">管理フラグ</p>
                <label className="flex items-center gap-2 text-[13px] text-[#2c3e50] cursor-pointer">
                  <input type="checkbox" checked={isBlacklisted} onChange={(e) => setIsBlacklisted(e.target.checked)} />
                  <span>ブラックリスト（入店拒否）</span>
                  <span className="text-[11px] text-[#8e9baa]">※ オーナーのみ変更可</span>
                </label>
                <label className="flex items-center gap-2 text-[13px] text-[#2c3e50] cursor-pointer">
                  <input type="checkbox" checked={isHidden} onChange={(e) => setIsHidden(e.target.checked)} />
                  <span>非表示（一般スタッフの検索結果に出さない）</span>
                </label>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium text-[#ffffff] bg-[#3a8f7c] hover:bg-[#2f7a69] rounded-[6px] transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  保存
                </button>
                {saveMsg && (
                  <span className="flex items-center gap-1 text-[12px] text-[#1e7e34]">
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
                  <tr className="border-b border-[#e8e4df]">
                    <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">日時</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">卓</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">金額</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">滞在時間</th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">ステータス</th>
                  </tr>
                </thead>
                <tbody>
                  {visitHistory.map((v) => {
                    const h = Math.floor(v.stayMinutes / 60);
                    const m = v.stayMinutes % 60;
                    const stayStr = h > 0 ? `${h}時間${m}分` : `${m}分`;
                    return (
                      <tr key={v.id} className="border-b border-[#f3f0ec] hover:bg-[#faf8f5] cursor-pointer transition-colors">
                        <td className="px-3 py-2.5 text-[#5a6977]">{v.date}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block px-2 py-0.5 bg-[#faf8f5] rounded-[4px] text-[12px] font-medium">
                            {v.table}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-[#2c3e50]">¥{v.amount.toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-[#5a6977]">{stayStr}</td>
                        <td className="px-3 py-2.5">
                          <span className="inline px-1.5 py-0.5 text-[10px] font-semibold rounded-[3px] bg-[#e8f5f0] text-[#3a8f7c]">
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

          {/* Tab 3: Chips & Points */}
          {activeTab === "チップ・ポイント" && (
            <div className="space-y-6">
              {/* Balances */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#faf8f5] rounded-[6px] p-4">
                  <div className="text-[11px] text-[#8e9baa] font-medium mb-1">チップ残高</div>
                  <div className="text-[22px] font-bold text-[#2c3e50]">{chipBalance.toLocaleString()}</div>
                </div>
                <div className="bg-[#faf8f5] rounded-[6px] p-4">
                  <div className="text-[11px] text-[#8e9baa] font-medium mb-1">ポイント残高</div>
                  <div className="text-[22px] font-bold text-[#2c3e50]">{pointBalance.toLocaleString()}</div>
                </div>
              </div>

              {/* Chip Grant */}
              <div>
                <h3 className="text-[13px] font-semibold text-[#2c3e50] mb-2">チップ付与</h3>

                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] text-[#8e9baa] mb-1">数量</label>
                    <input
                      type="number"
                      value={chipAmount}
                      onChange={(e) => setChipAmount(e.target.value)}
                      placeholder="例: 500"
                      className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] text-[#8e9baa] mb-1">理由</label>
                    <input
                      type="text"
                      value={chipReason}
                      onChange={(e) => setChipReason(e.target.value)}
                      placeholder="例: 来店ボーナス"
                      className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                    />
                  </div>
                  <button
                    onClick={handleChipGrant}
                    className="px-4 py-2 text-[13px] font-medium text-[#ffffff] bg-[#3a8f7c] hover:bg-[#2f7a69] rounded-[6px] transition-colors whitespace-nowrap"
                  >
                    付与
                  </button>
                </div>
                {/* Chip History */}
                <div className="mt-3 space-y-1">
                  {chipHistory.map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-1.5 px-2 text-[12px] rounded hover:bg-[#faf8f5]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8e9baa]">{e.date}</span>
                        <span className={`font-medium ${e.amount >= 0 ? "text-[#1e7e34]" : "text-[#c5221f]"}`}>
                          {e.amount >= 0 ? "+" : ""}{e.amount.toLocaleString()}
                        </span>
                        <span className="text-[#5a6977]">{e.reason}</span>
                      </div>
                      <span className="text-[#8e9baa]">残: {e.balanceAfter.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Point Grant */}
              <div>
                <h3 className="text-[13px] font-semibold text-[#2c3e50] mb-2">ポイント付与</h3>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-[11px] text-[#8e9baa] mb-1">数量</label>
                    <input
                      type="number"
                      value={pointAmount}
                      onChange={(e) => setPointAmount(e.target.value)}
                      placeholder="例: 100"
                      className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] text-[#8e9baa] mb-1">理由</label>
                    <input
                      type="text"
                      value={pointReason}
                      onChange={(e) => setPointReason(e.target.value)}
                      placeholder="例: 利用額ポイント"
                      className="w-full px-3 py-2 text-[13px] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c] focus:ring-1 focus:ring-[#3a8f7c]"
                    />
                  </div>
                  <button
                    onClick={handlePointGrant}
                    className="px-4 py-2 text-[13px] font-medium text-[#ffffff] bg-[#3a8f7c] hover:bg-[#2f7a69] rounded-[6px] transition-colors whitespace-nowrap"
                  >
                    付与
                  </button>
                </div>
                {/* Point History */}
                <div className="mt-3 space-y-1">
                  {pointHistory.map((e) => (
                    <div key={e.id} className="flex items-center justify-between py-1.5 px-2 text-[12px] rounded hover:bg-[#faf8f5]">
                      <div className="flex items-center gap-2">
                        <span className="text-[#8e9baa]">{e.date}</span>
                        <span className={`font-medium ${e.amount >= 0 ? "text-[#1e7e34]" : "text-[#c5221f]"}`}>
                          {e.amount >= 0 ? "+" : ""}{e.amount.toLocaleString()}
                        </span>
                        <span className="text-[#5a6977]">{e.reason}</span>
                      </div>
                      <span className="text-[#8e9baa]">残: {e.balanceAfter.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Prizes */}
          {activeTab === "プライズ" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[13px] font-semibold text-[#2c3e50]">付与済みプライズ</h3>
                {!showPrizeForm && (
                  <button
                    onClick={() => setShowPrizeForm(true)}
                    className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium text-[#ffffff] bg-[#3a8f7c] hover:bg-[#2f7a69] rounded-[6px] transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    プライズ付与
                  </button>
                )}
              </div>

              {showPrizeForm && (
                <div className="flex items-end gap-2 p-3 bg-[#faf8f5] rounded-[6px]">
                  <div className="flex-1">
                    <label className="block text-[11px] text-[#8e9baa] mb-1">プライズ選択</label>
                    <select
                      value={selectedPrize}
                      onChange={(e) => setSelectedPrize(e.target.value)}
                      className="w-full px-3 py-2 text-[13px] bg-[#ffffff] border border-[#d8d3cc] rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#3a8f7c]"
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
                    className="px-4 py-2 text-[13px] font-medium text-[#ffffff] bg-[#3a8f7c] hover:bg-[#2f7a69] rounded-[6px] transition-colors whitespace-nowrap"
                  >
                    付与
                  </button>
                  <button
                    onClick={() => setShowPrizeForm(false)}
                    className="px-3 py-2 text-[12px] text-[#5a6977] hover:text-[#2c3e50]"
                  >
                    キャンセル
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {prizes.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-[#f3f0ec] hover:bg-[#faf8f5] transition-colors">
                    <Gift className="w-4 h-4 text-[#7c3aed]" />
                    <span className="text-[13px] font-medium text-[#2c3e50]">{p.name}</span>
                    <span className="text-[12px] text-[#8e9baa] ml-auto">{p.date}</span>
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
                <span className="text-[13px] text-[#2c3e50]">未払あり</span>
                <button
                  onClick={() => setHasUnpaid(!hasUnpaid)}
                  className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
                    hasUnpaid ? "bg-[#c5221f]" : "bg-[#d8d3cc]"
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
                <div className="p-4 bg-[#fce8e6] border border-[#c5221f]/20 rounded-[6px]">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-[#c5221f]" />
                    <span className="text-[13px] font-medium text-[#c5221f]">未払いが発生しています</span>
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#c5221f]/70 mb-1">未払金額</label>
                    <input
                      type="number"
                      value={unpaidAmount}
                      onChange={(e) => setUnpaidAmount(e.target.value)}
                      placeholder="金額を入力"
                      className="w-full max-w-[200px] px-3 py-2 text-[13px] border border-[#c5221f]/30 rounded-[6px] text-[#2c3e50] focus:outline-none focus:border-[#c5221f] bg-[#ffffff]"
                    />
                  </div>
                </div>
              )}

              {/* Unpaid history */}
              <div>
                <h3 className="text-[13px] font-semibold text-[#2c3e50] mb-2">未払履歴</h3>
                <div className="space-y-2">
                  {unpaidHistory.map((u) => (
                    <div key={u.id} className="flex items-center justify-between px-3 py-2.5 border-b border-[#f3f0ec]">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] text-[#8e9baa]">{u.date}</span>
                        <span className="text-[13px] font-medium text-[#c5221f]">¥{u.amount.toLocaleString()}</span>
                        <span className="text-[12px] text-[#5a6977]">{u.note}</span>
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
