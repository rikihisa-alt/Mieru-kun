"use client";

import Link from "next/link";
import { Coins, Sparkles, ArrowLeft } from "lucide-react";

export default function MemberBalancePage() {
  return (
    <div className="ln-page">
      <div className="ln-stack">
        <Link href="/u3j5ny" className="ln-back">
          <ArrowLeft size={14} />マイページへ
        </Link>
        <h2 className="ln-h1">保有残高</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div className="ln-card ln-card-compact">
            <div className="ln-mute" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
              <Coins size={12} />リング
            </div>
            <div className="ln-num" style={{ fontSize: 20, fontWeight: 700, color: "var(--ln-accent-text)" }}>
              5,000<span className="ln-mute" style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>枚</span>
            </div>
          </div>
          <div className="ln-card ln-card-compact">
            <div className="ln-mute" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
              <Coins size={12} />サイド
            </div>
            <div className="ln-num" style={{ fontSize: 20, fontWeight: 700, color: "#d97706" }}>
              1,800<span className="ln-mute" style={{ fontSize: 11, fontWeight: 400, marginLeft: 2 }}>枚</span>
            </div>
          </div>
          <div className="ln-card ln-card-compact" style={{ gridColumn: "span 2" }}>
            <div className="ln-mute" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10 }}>
              <Sparkles size={12} />マルチケ
            </div>
            <div className="ln-num" style={{ fontSize: 24, fontWeight: 700, color: "#7c3aed" }}>
              12<span className="ln-mute" style={{ fontSize: 12, fontWeight: 400, marginLeft: 4 }}>枚</span>
            </div>
            <div className="ln-mute" style={{ fontSize: 10, marginTop: 4 }}>うち5枚は2026-06-30まで有効</div>
          </div>
        </div>

        <p className="ln-mute" style={{ fontSize: 11, margin: 0 }}>残高に反映されるまで時間がかかる場合があります</p>
        <p style={{ fontSize: 10, color: "var(--ln-text-mute)", margin: 0 }}>
          ※ 表示はサンプルです。正式公開時に実データに切り替わります
        </p>
      </div>
    </div>
  );
}
