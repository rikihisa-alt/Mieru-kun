"use client";

import { useState } from "react";
import { QrCode, Search, DoorOpen, Coins, Sparkles, CreditCard, X, AlertTriangle, Phone, Construction } from "lucide-react";

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

const RANK_COLOR: Record<string, string> = {
  vip: "#7c3aed",
  gold: "var(--ln-warn)",
  silver: "#475569",
  regular: "var(--ln-text-mute)",
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
      setToast("会員が見つかりません。番号をご確認ください");
      setTimeout(() => setToast(""), 2500);
    }
  }

  function action(label: string) {
    setToast(`${label}は準備中です。管理画面(iPad/PC)から操作してください`);
    setTimeout(() => setToast(""), 2500);
  }

  return (
    <div className="ln-page">
      <div className="ln-stack">
        <h1 className="ln-h1" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <QrCode size={20} style={{ color: "var(--ln-accent)" }} />QRスキャン
        </h1>

        {/* 読取シミュレーション */}
        <div className="ln-card">
          <label className="ln-sub" style={{ display: "block", fontSize: 12, marginBottom: 8 }}>会員番号 or 会員ID を入力 (QR代用)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="text" value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="0001 / a8f3d9c2" />
            <button onClick={scan} className="ln-btn ln-btn--primary" style={{ flexShrink: 0, padding: "0 14px" }}>
              <Search size={16} />
            </button>
          </div>
        </div>

        {/* 会員カード */}
        {member && (
          <div className="ln-card ln-stack-sm">
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>{member.nickname}</span>
                  <span className="ln-mute" style={{ fontSize: 11 }}>{member.realName}</span>
                  <span style={{ fontSize: 9, color: "var(--ln-text-mute)", border: "1px solid var(--ln-border)", borderRadius: 999, padding: "1px 6px" }}>デモ表示</span>
                </div>
                <div className="ln-mute" style={{ fontSize: 11 }}>会員番号 {member.memberNo}</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: RANK_COLOR[member.rank] }}>{RANK_LABEL[member.rank]}</span>
                <span className={member.todayCheckedIn ? "ln-chip ln-chip--success" : "ln-chip"}>
                  {member.todayCheckedIn ? "本日来店済" : "未チェックイン"}
                </span>
              </div>
              <button onClick={() => setMember(null)} className="ln-btn ln-btn--ghost ln-btn--sm" style={{ padding: 4, height: 24 }}>
                <X size={14} />
              </button>
            </div>

            {member.caution && (
              <div className="ln-row" style={{ padding: "8px 12px", background: "var(--ln-warn-soft)", borderRadius: "var(--ln-radius-sm)", alignItems: "flex-start" }}>
                <AlertTriangle size={16} style={{ color: "var(--ln-warn)", flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 11, color: "#8a5a10" }}>{member.caution}</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              <MiniStat label="リング" value={member.ringBalance.toLocaleString()} color="var(--ln-accent-text)" />
              <MiniStat label="サイド" value={member.sideBalance.toLocaleString()} color="#d97706" />
              <MiniStat label="マルチケ" value={member.multikeBalance.toLocaleString()} color="#7c3aed" />
            </div>

            <div className="ln-row ln-mute" style={{ fontSize: 11 }}>
              最終来店: {member.lastVisit}
              {member.phone && (<><span style={{ margin: "0 4px" }}>·</span><Phone size={12} />{member.phone}</>)}
            </div>

            <div style={{ paddingTop: 8, borderTop: "1px solid var(--ln-border-soft)" }}>
              <div className="ln-row" style={{ marginBottom: 6 }}>
                <Construction size={12} className="ln-mute" />
                <span className="ln-mute" style={{ fontSize: 10 }}>これらの操作は準備中です。管理画面(iPad/PC)をご利用ください</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <ActionButton icon={<DoorOpen size={16} />} label="来店処理" color="var(--ln-accent-text)" onClick={() => action("来店処理")} />
                <ActionButton icon={<Coins size={16} />} label="チップ引出" color="#d97706" onClick={() => action("チップ引出")} />
                <ActionButton icon={<Sparkles size={16} />} label="マルチケ消化" color="#7c3aed" onClick={() => action("マルチケ消化")} />
                <ActionButton icon={<CreditCard size={16} />} label="会計登録" color="#2c3e50" onClick={() => action("会計登録")} />
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            style={{
              position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
              padding: "8px 16px", background: "var(--ln-text)", color: "#fff",
              fontSize: 12, borderRadius: 6, boxShadow: "var(--ln-shadow-lg)", zIndex: 50,
            }}
          >
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ background: "var(--ln-bg-alt)", borderRadius: 6, padding: 8, textAlign: "center" }}>
      <div className="ln-mute" style={{ fontSize: 10 }}>{label}</div>
      <div className="ln-num" style={{ fontSize: 14, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function ActionButton({ icon, label, color, onClick }: { icon: React.ReactNode; label: string; color: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="ln-btn" style={{ justifyContent: "flex-start", gap: 8, fontSize: 12, opacity: 0.55 }}>
      <span style={{ color }}>{icon}</span>
      {label}
    </button>
  );
}
