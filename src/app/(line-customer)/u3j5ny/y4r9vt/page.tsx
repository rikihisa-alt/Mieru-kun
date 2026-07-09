"use client";

import { Activity, Users, Armchair, Flame } from "lucide-react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function MemberLiveStatusPage() {
  const score = 62;
  const level = score >= 80 ? { label: "非常に混雑", color: "var(--ln-danger)" } : score >= 55 ? { label: "混雑", color: "var(--ln-warn)" } : { label: "通常", color: "var(--ln-accent)" };

  return (
    <div className="ln-page">
      <div className="ln-stack">
        <Link href="/u3j5ny" className="ln-back">
          <ArrowLeft size={14} />マイページへ
        </Link>
        <h2 className="ln-h1">店内状況</h2>

        <div className="ln-card">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
            <span className="ln-sub" style={{ fontSize: 13 }}>現在の混雑度</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: level.color }}>{level.label}</span>
          </div>
          <div style={{ height: 8, background: "var(--ln-bg-alt)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ height: "100%", borderRadius: 999, width: `${score}%`, backgroundColor: level.color }} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            { icon: <Users size={16} />, label: "来店", value: "18名" },
            { icon: <Armchair size={16} />, label: "空席", value: "12席" },
            { icon: <Activity size={16} />, label: "リング", value: "2卓稼働" },
            { icon: <Flame size={16} />, label: "トナメ", value: "進行中" },
          ].map((m) => (
            <div key={m.label} className="ln-card ln-card-compact" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--ln-bg-alt)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ln-text-sub)" }}>
                {m.icon}
              </div>
              <div>
                <div className="ln-mute" style={{ fontSize: 10 }}>{m.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{m.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
