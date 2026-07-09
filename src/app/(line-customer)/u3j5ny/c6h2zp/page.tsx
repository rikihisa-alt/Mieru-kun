"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Medal, TrendingUp } from "lucide-react";

type Metric = "total" | "visits" | "points" | "ring_net" | "tournaments" | "multike" | "sns";
type Period = "monthly" | "season" | "all_time";

const METRIC_LABEL: Record<Metric, string> = {
  total: "総合",
  visits: "来店",
  points: "ポイント",
  ring_net: "リング純増",
  tournaments: "トナメ",
  multike: "マルチケ",
  sns: "SNS",
};
const METRIC_UNIT: Record<Metric, string> = {
  total: "pt", visits: "回", points: "pt", ring_net: "枚", tournaments: "回", multike: "枚", sns: "回",
};
const PERIOD_LABEL: Record<Period, string> = { monthly: "月間", season: "シーズン", all_time: "通期" };

interface Row {
  rank: number;
  nickname: string;
  value: number;
  self?: boolean;
  delta?: number;
}

const MONTHLY_DATA: Record<Metric, Row[]> = {
  total: [
    { rank: 1, nickname: "ハナ", value: 8420, delta: 0 },
    { rank: 2, nickname: "タロウ", value: 6830, delta: +1 },
    { rank: 3, nickname: "ユウ", value: 5120, delta: -1 },
    { rank: 4, nickname: "ケン", value: 3600, delta: +2 },
    { rank: 5, nickname: "あなた", value: 2880, self: true, delta: +1 },
    { rank: 6, nickname: "ショウ", value: 2200, delta: -2 },
    { rank: 7, nickname: "ダイ", value: 1450, delta: 0 },
  ],
  visits: [
    { rank: 1, nickname: "ハナ", value: 28 },
    { rank: 2, nickname: "タロウ", value: 22 },
    { rank: 3, nickname: "ユウ", value: 19 },
    { rank: 4, nickname: "あなた", value: 15, self: true },
    { rank: 5, nickname: "ケン", value: 12 },
  ],
  points: [
    { rank: 1, nickname: "ハナ", value: 3800 },
    { rank: 2, nickname: "タロウ", value: 2900 },
    { rank: 3, nickname: "ユウ", value: 2500 },
    { rank: 4, nickname: "ショウ", value: 1800 },
    { rank: 5, nickname: "あなた", value: 1420, self: true },
  ],
  ring_net: [
    { rank: 1, nickname: "ハナ", value: 18000 },
    { rank: 2, nickname: "タロウ", value: 12000 },
    { rank: 3, nickname: "ユウ", value: 8500 },
    { rank: 4, nickname: "あなた", value: 3200, self: true },
  ],
  tournaments: [
    { rank: 1, nickname: "タロウ", value: 15 },
    { rank: 2, nickname: "ケン", value: 12 },
    { rank: 3, nickname: "あなた", value: 8, self: true },
    { rank: 4, nickname: "ハナ", value: 8 },
  ],
  multike: [
    { rank: 1, nickname: "ハナ", value: 42 },
    { rank: 2, nickname: "ユウ", value: 38 },
    { rank: 3, nickname: "あなた", value: 21, self: true },
    { rank: 4, nickname: "タロウ", value: 18 },
  ],
  sns: [
    { rank: 1, nickname: "ハナ", value: 24 },
    { rank: 2, nickname: "あなた", value: 12, self: true },
    { rank: 3, nickname: "ユウ", value: 12 },
  ],
};

const SEASON_DATA: Record<Metric, Row[]> = {
  total: [
    { rank: 1, nickname: "ユウ", value: 21500, delta: +2 },
    { rank: 2, nickname: "ハナ", value: 19800, delta: -1 },
    { rank: 3, nickname: "あなた", value: 14200, self: true, delta: +3 },
    { rank: 4, nickname: "タロウ", value: 13650, delta: -1 },
    { rank: 5, nickname: "ケン", value: 9700, delta: 0 },
    { rank: 6, nickname: "ダイ", value: 6400, delta: -1 },
    { rank: 7, nickname: "ショウ", value: 5200, delta: 0 },
  ],
  visits: [
    { rank: 1, nickname: "ユウ", value: 74 },
    { rank: 2, nickname: "ハナ", value: 68 },
    { rank: 3, nickname: "タロウ", value: 55 },
    { rank: 4, nickname: "あなた", value: 41, self: true },
    { rank: 5, nickname: "ケン", value: 30 },
  ],
  points: [
    { rank: 1, nickname: "ハナ", value: 9600 },
    { rank: 2, nickname: "あなた", value: 7400, self: true },
    { rank: 3, nickname: "タロウ", value: 7100 },
    { rank: 4, nickname: "ユウ", value: 6200 },
    { rank: 5, nickname: "ショウ", value: 4100 },
  ],
  ring_net: [
    { rank: 1, nickname: "タロウ", value: 41000 },
    { rank: 2, nickname: "ハナ", value: 33500 },
    { rank: 3, nickname: "あなた", value: 15800, self: true },
    { rank: 4, nickname: "ユウ", value: 12200 },
  ],
  tournaments: [
    { rank: 1, nickname: "あなた", value: 26, self: true },
    { rank: 2, nickname: "タロウ", value: 24 },
    { rank: 3, nickname: "ケン", value: 19 },
    { rank: 4, nickname: "ハナ", value: 15 },
  ],
  multike: [
    { rank: 1, nickname: "ユウ", value: 96 },
    { rank: 2, nickname: "ハナ", value: 88 },
    { rank: 3, nickname: "タロウ", value: 52 },
    { rank: 4, nickname: "あなた", value: 49, self: true },
  ],
  sns: [
    { rank: 1, nickname: "ハナ", value: 61 },
    { rank: 2, nickname: "ユウ", value: 40 },
    { rank: 3, nickname: "あなた", value: 33, self: true },
  ],
};

const ALL_TIME_DATA: Record<Metric, Row[]> = {
  total: [
    { rank: 1, nickname: "ハナ", value: 68400, delta: 0 },
    { rank: 2, nickname: "タロウ", value: 55200, delta: 0 },
    { rank: 3, nickname: "ユウ", value: 49800, delta: +1 },
    { rank: 4, nickname: "あなた", value: 31200, self: true, delta: +2 },
    { rank: 5, nickname: "ケン", value: 27600, delta: -1 },
    { rank: 6, nickname: "ダイ", value: 18300, delta: -1 },
    { rank: 7, nickname: "ショウ", value: 15100, delta: 0 },
  ],
  visits: [
    { rank: 1, nickname: "ハナ", value: 312 },
    { rank: 2, nickname: "タロウ", value: 268 },
    { rank: 3, nickname: "ユウ", value: 201 },
    { rank: 4, nickname: "あなた", value: 156, self: true },
    { rank: 5, nickname: "ケン", value: 122 },
  ],
  points: [
    { rank: 1, nickname: "ハナ", value: 42000 },
    { rank: 2, nickname: "タロウ", value: 33500 },
    { rank: 3, nickname: "ユウ", value: 28800 },
    { rank: 4, nickname: "あなた", value: 19600, self: true },
    { rank: 5, nickname: "ショウ", value: 14200 },
  ],
  ring_net: [
    { rank: 1, nickname: "ハナ", value: 210000 },
    { rank: 2, nickname: "タロウ", value: 158000 },
    { rank: 3, nickname: "ユウ", value: 96000 },
    { rank: 4, nickname: "あなた", value: 44500, self: true },
  ],
  tournaments: [
    { rank: 1, nickname: "タロウ", value: 132 },
    { rank: 2, nickname: "ケン", value: 98 },
    { rank: 3, nickname: "あなた", value: 61, self: true },
    { rank: 4, nickname: "ハナ", value: 57 },
  ],
  multike: [
    { rank: 1, nickname: "ハナ", value: 480 },
    { rank: 2, nickname: "ユウ", value: 415 },
    { rank: 3, nickname: "あなた", value: 203, self: true },
    { rank: 4, nickname: "タロウ", value: 189 },
  ],
  sns: [
    { rank: 1, nickname: "ハナ", value: 205 },
    { rank: 2, nickname: "あなた", value: 118, self: true },
    { rank: 3, nickname: "ユウ", value: 110 },
  ],
};

const DATA_BY_PERIOD: Record<Period, Record<Metric, Row[]>> = {
  monthly: MONTHLY_DATA,
  season: SEASON_DATA,
  all_time: ALL_TIME_DATA,
};

export default function MemberRankingPage() {
  const [metric, setMetric] = useState<Metric>("total");
  const [period, setPeriod] = useState<Period>("monthly");

  const rows = DATA_BY_PERIOD[period][metric];
  const me = rows.find(r => r.self);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="ln-page">
      <div className="ln-stack">
        <Link href="/u3j5ny" className="ln-back">
          <ArrowLeft size={14} />マイページへ
        </Link>

        <h2 className="ln-h1" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Trophy size={18} style={{ color: "var(--ln-warn)" }} />ランキング
        </h2>

        {/* 期間切替 */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", margin: "0 -4px", padding: "0 4px" }}>
          {(Object.keys(PERIOD_LABEL) as Period[]).map(p => {
            const active = period === p;
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={active ? "ln-btn ln-btn--primary ln-btn--sm" : "ln-btn ln-btn--sm"}
                style={{ borderRadius: 999, whiteSpace: "nowrap" }}
              >
                {PERIOD_LABEL[p]}
              </button>
            );
          })}
        </div>

        {/* メトリクス切替 */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", margin: "0 -4px", padding: "0 4px 4px" }}>
          {(Object.keys(METRIC_LABEL) as Metric[]).map(m => {
            const active = metric === m;
            return (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={active ? "ln-btn ln-btn--primary ln-btn--sm" : "ln-btn ln-btn--sm"}
                style={{ whiteSpace: "nowrap" }}
              >
                {METRIC_LABEL[m]}
              </button>
            );
          })}
        </div>

        {/* 自分の順位ハイライト */}
        {me && (
          <div className="ln-card" style={{ background: "var(--ln-accent-soft)", borderColor: "transparent", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--ln-accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
              {me.rank}
            </div>
            <div className="ln-grow">
              <p className="ln-mute" style={{ fontSize: 10, margin: 0 }}>あなたの順位</p>
              <p className="ln-num" style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                {me.value.toLocaleString()}
                <span className="ln-mute" style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>{METRIC_UNIT[metric]}</span>
              </p>
            </div>
            {me.delta != null && me.delta !== 0 && (
              <div style={{ textAlign: "right" }}>
                <TrendingUp
                  size={14}
                  style={{
                    color: me.delta > 0 ? "var(--ln-accent-text)" : "var(--ln-danger)",
                    transform: me.delta > 0 ? "none" : "rotate(180deg)",
                    marginLeft: "auto",
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 700, color: me.delta > 0 ? "var(--ln-accent-text)" : "var(--ln-danger)" }}>
                  {me.delta > 0 ? "+" : ""}{me.delta}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Top3 表彰台 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {top3.map(r => {
            const color = r.rank === 1 ? "#d97706" : r.rank === 2 ? "#6b7280" : "#a16207";
            return (
              <div
                key={r.rank}
                className="ln-card ln-card-compact"
                style={{
                  textAlign: "center",
                  background: r.self ? "var(--ln-accent-soft)" : undefined,
                  borderColor: r.self ? "transparent" : undefined,
                  padding: "10px",
                }}
              >
                <Medal size={20} style={{ color, margin: "0 auto" }} />
                <p style={{ fontSize: 11, fontWeight: 500, margin: "4px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.nickname}{r.self && <span style={{ fontSize: 9, color: "var(--ln-accent-text)", marginLeft: 2 }}>YOU</span>}
                </p>
                <p className="ln-num" style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>{r.value.toLocaleString()}</p>
                <p className="ln-mute" style={{ fontSize: 9, margin: 0 }}>{METRIC_UNIT[metric]}</p>
              </div>
            );
          })}
        </div>

        {/* 4位以降 */}
        {rest.length > 0 && (
          <div className="ln-list">
            {rest.map(r => (
              <div
                key={r.rank}
                className="ln-list__item"
                style={{ background: r.self ? "var(--ln-accent-soft)" : undefined }}
              >
                <span className="ln-num ln-mute" style={{ width: 24, textAlign: "center", fontSize: 12 }}>{r.rank}</span>
                <span className="ln-grow" style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.nickname}
                  {r.self && <span style={{ fontSize: 10, color: "var(--ln-accent-text)", marginLeft: 4 }}>YOU</span>}
                </span>
                <span className="ln-num" style={{ fontSize: 13, fontWeight: 700 }}>
                  {r.value.toLocaleString()}
                  <span className="ln-mute" style={{ fontSize: 10, fontWeight: 400, marginLeft: 2 }}>{METRIC_UNIT[metric]}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="ln-mute" style={{ fontSize: 10, margin: 0 }}>
          {metric === "total"
            ? "※ 総合スコアは項目ごとの係数(来店/ポイント/リング純増/トナメ/マルチケ/SNS)から店舗が算出しています"
            : `※ ${PERIOD_LABEL[period]}の${METRIC_LABEL[metric]}集計`}
        </p>
        <p style={{ fontSize: 10, color: "var(--ln-text-mute)", margin: 0 }}>
          ※ 表示はサンプルです。正式公開時に実データに切り替わります
        </p>
      </div>
    </div>
  );
}
