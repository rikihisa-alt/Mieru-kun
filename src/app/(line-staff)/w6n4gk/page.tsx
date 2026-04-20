"use client";

import { useState } from "react";
import { QrCode, Search, DoorOpen, Coins, Sparkles, CreditCard, X, AlertTriangle, Phone } from "lucide-react";

interface MemberSnapshot {
  id: string;
  memberNo: string;
  nickname: string;
  realName: string;
  rank: "regular" | "silver" | "gold" | "vip";
  todayCheckedIn: boolean;
  ringBalance: number;
  sideBalance: number;
  multikeBalance: number;
  lastVisit: string;
  caution?: string;
  phone?: string;
}

const DEMO_MEMBERS: Record<string, MemberSnapshot> = {
  "a8f3d9c2": { id: "a8f3d9c2", memberNo: "0001", nickname: "タロウ", realName: "田中 太郎", rank: "gold", todayCheckedIn: true, ringBalance: 5000, sideBalance: 1800, multikeBalance: 12, lastVisit: "2026-04-17", phone: "090-1234-5678" },
  "b4c9d2f1": { id: "b4c9d2f1", memberNo: "0002", nickname: "ハナ", realName: "鈴木 花子", rank: "vip", todayCheckedIn: false, ringBalance: 12000, sideBalance: 4500, multikeBalance: 38, lastVisit: "2026-04-19", caution: "誕生日月（4月）: ケア厚めに" },
};

const RANK_TEXT: Record<string, string> = {
  vip: "text-[#7c3aed]",
  gold: "text-status-warning",
  silver: "text-[#475569]",
  regular: "text-text-tertiary",
};
const RANK_LABEL: Record<string, string> = { vip: "VIP", gold: "GOLD", silver: "SILVER", regular: "Regular" };

export default function QRScanPage() {
  const [scanInput, setScanInput] = useState("");
  const [member, setMember] = useState<MemberSnapshot | null>(null);
  const [toast, setToast] = useState("");

  function scan() {
    const m = DEMO_MEMBERS[scanInput.trim()] ?? Object.values(DEMO_MEMBERS).find((x) => x.memberNo === scanInput.trim());
    if (m) {
      setMember(m);
      setScanInput("");
    } else {
      setToast("会員が見つかりません (デモでは c1..c2 の UUID か 0001/0002 でヒット)");
      setTimeout(() => setToast(""), 2500);
    }
  }

  function action(label: string) {
    setToast(`${label}: 実行しました (デモ)`);
    setTimeout(() => setToast(""), 2000);
  }

  return (
    <div className="min-h-screen bg-bg px-4 py-6 max-w-md mx-auto">
      <h1 className="text-[18px] font-bold text-text-primary mb-4 flex items-center gap-2">
        <QrCode className="w-5 h-5 text-accent" />QRスキャン
      </h1>

      {/* 読取シミュレーション */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-4 mb-4">
        <label className="block text-[12px] text-text-secondary mb-2">会員番号 or 会員ID を入力 (QR代用)</label>
        <div className="flex gap-2">
          <input type="text" value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="0001 / a8f3d9c2" />
          <button onClick={scan} className="px-4 py-2 bg-accent text-white text-[13px] font-medium rounded-[var(--radius)]">
            <Search className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-text-tertiary">
          ※ 本番ではカメラQR読取 (zxing) を起動
        </p>
      </div>

      {/* 会員カード */}
      {member && (
        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-[16px] font-bold">{member.nickname}</span>
                <span className="text-[11px] text-text-tertiary">{member.realName}</span>
              </div>
              <div className="text-[11px] text-text-tertiary">会員番号 {member.memberNo}</div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[11px] font-semibold tracking-wider ${RANK_TEXT[member.rank]}`}>{RANK_LABEL[member.rank]}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-[3px] ${member.todayCheckedIn ? "bg-status-success-bg text-status-success" : "bg-bg text-text-tertiary border border-border"}`}>
                {member.todayCheckedIn ? "本日来店済" : "未チェックイン"}
              </span>
            </div>
            <button onClick={() => setMember(null)} className="text-text-tertiary p-1 hover:bg-bg-hover rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {member.caution && (
            <div className="px-3 py-2 bg-status-warning-bg border border-[#c87b1a]/30 rounded-[6px] flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-status-warning shrink-0 mt-0.5" />
              <span className="text-[11px] text-[#8a5a10]">{member.caution}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="リング" value={member.ringBalance.toLocaleString()} color="#3a8f7c" />
            <MiniStat label="サイド" value={member.sideBalance.toLocaleString()} color="#d97706" />
            <MiniStat label="マルチケ" value={member.multikeBalance.toLocaleString()} color="#7c3aed" />
          </div>

          <div className="flex items-center gap-1 text-[11px] text-text-tertiary">
            最終来店: {member.lastVisit}
            {member.phone && (<><span className="mx-1">·</span><Phone className="w-3 h-3" />{member.phone}</>)}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-light">
            <ActionButton icon={<DoorOpen className="w-4 h-4" />} label="来店処理" color="#3a8f7c" onClick={() => action("来店処理")} />
            <ActionButton icon={<Coins className="w-4 h-4" />} label="チップ引出" color="#d97706" onClick={() => action("チップ引出")} />
            <ActionButton icon={<Sparkles className="w-4 h-4" />} label="マルチケ消化" color="#7c3aed" onClick={() => action("マルチケ消化")} />
            <ActionButton icon={<CreditCard className="w-4 h-4" />} label="会計登録" color="#2c3e50" onClick={() => action("会計登録")} />
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-text-primary text-white text-[12px] rounded-[6px] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-bg rounded-[6px] p-2 text-center">
      <div className="text-[10px] text-text-tertiary">{label}</div>
      <div className="text-[14px] font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-3 py-2.5 border border-border rounded-[var(--radius)] text-[12px] font-medium text-text-primary hover:bg-bg-hover transition-colors">
      <span style={{ color }}>{icon}</span>
      {label}
    </button>
  );
}
