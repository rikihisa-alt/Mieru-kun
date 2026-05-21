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
  delta?: number; // 前回からの順位変動
}

const DATA: Record<Metric, Row[]> = {
  total: [], visits: [], points: [], ring_net: [],
  tournaments: [], multike: [], sns: [],
};

export default function MemberRankingPage() {
  const [metric, setMetric] = useState<Metric>("total");
  const [period, setPeriod] = useState<Period>("monthly");

  const rows = DATA[metric];
  const me = rows.find(r => r.self);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="space-y-4">
      <Link href="/u3j5ny" className="flex items-center gap-1 text-[12px] text-text-tertiary hover:text-text-secondary">
        <ArrowLeft className="w-3.5 h-3.5" />マイページへ
      </Link>

      <h2 className="text-[16px] font-bold flex items-center gap-2">
        <Trophy className="w-5 h-5 text-status-warning" />
        ランキング
      </h2>

      {/* 期間切替 */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1">
        {(Object.keys(PERIOD_LABEL) as Period[]).map(p => {
          const active = period === p;
          return (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-[11px] font-medium rounded-full whitespace-nowrap border transition-colors ${
                active ? "bg-accent text-white border-accent" : "bg-bg-white text-text-secondary border-border"
              }`}
            >
              {PERIOD_LABEL[p]}
            </button>
          );
        })}
      </div>

      {/* メトリクス切替 */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1">
        {(Object.keys(METRIC_LABEL) as Metric[]).map(m => {
          const active = metric === m;
          return (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-[6px] whitespace-nowrap border transition-colors ${
                active ? "bg-text-primary text-white border-text-primary" : "bg-bg-white text-text-secondary border-border"
              }`}
            >
              {METRIC_LABEL[m]}
            </button>
          );
        })}
      </div>

      {/* 自分の順位ハイライト */}
      {me && (
        <div className="bg-accent-light border border-accent/30 rounded-[var(--radius-lg)] p-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-bold text-[16px] flex-shrink-0">
            {me.rank}
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-text-tertiary">あなたの順位</p>
            <p className="text-[16px] font-bold">
              {me.value.toLocaleString()}
              <span className="text-[11px] font-normal text-text-tertiary ml-1">{METRIC_UNIT[metric]}</span>
            </p>
          </div>
          {me.delta != null && me.delta !== 0 && (
            <div className="text-right">
              <TrendingUp className={`w-3.5 h-3.5 ml-auto ${me.delta > 0 ? "text-status-success" : "text-status-danger rotate-180"}`} />
              <span className={`text-[11px] font-bold ${me.delta > 0 ? "text-status-success" : "text-status-danger"}`}>
                {me.delta > 0 ? "+" : ""}{me.delta}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Top3 表彰台 */}
      <div className="grid grid-cols-3 gap-1.5">
        {top3.map(r => {
          const color = r.rank === 1 ? "#d97706" : r.rank === 2 ? "#6b7280" : "#a16207";
          return (
            <div
              key={r.rank}
              className={`bg-bg-white border rounded-[var(--radius-lg)] p-2.5 text-center ${r.self ? "border-accent/40 bg-accent-light" : "border-border"}`}
            >
              <Medal className="w-5 h-5 mx-auto" style={{ color }} />
              <p className="text-[11px] font-medium mt-1 truncate">{r.nickname}{r.self && <span className="text-[9px] text-accent ml-0.5">YOU</span>}</p>
              <p className="text-[14px] font-bold tabular-nums">{r.value.toLocaleString()}</p>
              <p className="text-[9px] text-text-tertiary">{METRIC_UNIT[metric]}</p>
            </div>
          );
        })}
      </div>

      {/* 4位以降 */}
      {rest.length > 0 && (
        <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] divide-y divide-border-light">
          {rest.map(r => (
            <div
              key={r.rank}
              className={`flex items-center gap-3 px-3 py-2.5 ${r.self ? "bg-accent-light" : ""}`}
            >
              <span className="w-6 text-center text-[12px] text-text-tertiary font-mono">{r.rank}</span>
              <span className="flex-1 text-[13px] font-medium truncate">
                {r.nickname}
                {r.self && <span className="text-[10px] text-accent ml-1">YOU</span>}
              </span>
              <span className="text-[13px] font-bold tabular-nums">
                {r.value.toLocaleString()}
                <span className="text-[10px] font-normal text-text-tertiary ml-0.5">{METRIC_UNIT[metric]}</span>
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-text-tertiary">
        {metric === "total"
          ? "※ 総合スコアは項目ごとの係数(来店/ポイント/リング純増/トナメ/マルチケ/SNS)から店舗が算出しています"
          : `※ ${PERIOD_LABEL[period]}の${METRIC_LABEL[metric]}集計`}
      </p>
    </div>
  );
}
