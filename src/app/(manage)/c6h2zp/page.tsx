"use client";

import { useState } from "react";
import { Trophy, Medal } from "lucide-react";

type Metric = "visits" | "points" | "ring_net" | "tournaments" | "multike" | "sns" | "total";
type Period = "monthly" | "season" | "all_time";

const METRIC_LABEL: Record<Metric, string> = {
  visits: "来店回数",
  points: "来店ポイント",
  ring_net: "リング純増",
  tournaments: "トナメ参加",
  multike: "マルチケ獲得",
  sns: "SNS投稿",
  total: "総合",
};
const PERIOD_LABEL: Record<Period, string> = {
  monthly: "月間",
  season: "シーズン",
  all_time: "通期",
};

interface Row {
  rank: number;
  nickname: string;
  realName: string;
  value: number;
  publicLevel: "public" | "nickname_only" | "private";
}

const DEMO: Record<Metric, Row[]> = {
  visits: [
    { rank: 1, nickname: "ハナ", realName: "鈴木 花子", value: 28, publicLevel: "nickname_only" },
    { rank: 2, nickname: "タロウ", realName: "田中 太郎", value: 22, publicLevel: "public" },
    { rank: 3, nickname: "ユウ", realName: "渡辺 優子", value: 19, publicLevel: "nickname_only" },
    { rank: 4, nickname: "ケン", realName: "佐藤 健一", value: 12, publicLevel: "nickname_only" },
    { rank: 5, nickname: "ショウ", realName: "山本 翔太", value: 10, publicLevel: "private" },
  ],
  points: [
    { rank: 1, nickname: "ハナ", realName: "鈴木 花子", value: 3800, publicLevel: "nickname_only" },
    { rank: 2, nickname: "タロウ", realName: "田中 太郎", value: 2900, publicLevel: "public" },
    { rank: 3, nickname: "ユウ", realName: "渡辺 優子", value: 2500, publicLevel: "nickname_only" },
  ],
  ring_net: [
    { rank: 1, nickname: "ハナ", realName: "鈴木 花子", value: 18000, publicLevel: "nickname_only" },
    { rank: 2, nickname: "タロウ", realName: "田中 太郎", value: 12000, publicLevel: "public" },
  ],
  tournaments: [
    { rank: 1, nickname: "タロウ", realName: "田中 太郎", value: 15, publicLevel: "public" },
    { rank: 2, nickname: "ケン", realName: "佐藤 健一", value: 12, publicLevel: "nickname_only" },
  ],
  multike: [
    { rank: 1, nickname: "ハナ", realName: "鈴木 花子", value: 42, publicLevel: "nickname_only" },
    { rank: 2, nickname: "ユウ", realName: "渡辺 優子", value: 38, publicLevel: "nickname_only" },
  ],
  sns: [
    { rank: 1, nickname: "ハナ", realName: "鈴木 花子", value: 24, publicLevel: "nickname_only" },
  ],
  total: [
    { rank: 1, nickname: "ハナ", realName: "鈴木 花子", value: 8420, publicLevel: "nickname_only" },
    { rank: 2, nickname: "タロウ", realName: "田中 太郎", value: 6830, publicLevel: "public" },
    { rank: 3, nickname: "ユウ", realName: "渡辺 優子", value: 5120, publicLevel: "nickname_only" },
  ],
};

export default function RankingPage() {
  const [metric, setMetric] = useState<Metric>("total");
  const [period, setPeriod] = useState<Period>("monthly");

  const rows = DEMO[metric] || [];

  return (
    <div className="page-stack">
      {/* セレクタ */}
      <section>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="tabs">
            {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
              <button key={m} onClick={() => setMetric(m)} className={`tab ${metric === m ? "tab-active" : ""}`}>
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>
          <div className="ml-auto tabs">
            {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} className={`tab ${period === p ? "tab-active" : ""}`}>
                {PERIOD_LABEL[p]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Top3カード (Glass Podium) */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rows.slice(0, 3).map((r) => {
            const display = r.publicLevel === "public" ? `${r.nickname} (${r.realName})` : r.publicLevel === "nickname_only" ? r.nickname : "非公開";
            const podiumLabel = r.rank === 1 ? "GOLD" : r.rank === 2 ? "SILVER" : "BRONZE";
            const podiumColor = r.rank === 1 ? "#d97706" : r.rank === 2 ? "#6b7280" : "#a16207";
            const chipClass = r.rank === 1 ? "chip-gold" : r.rank === 2 ? "chip-neutral" : "chip-warning";
            return (
              <div key={r.rank} className="glass-panel text-center" style={{ padding: 24 }}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Medal className="w-5 h-5" style={{ color: podiumColor }} />
                  <span className={`chip ${chipClass} chip-sm`}>{podiumLabel}</span>
                </div>
                <div className="text-[16px] font-semibold text-text-primary">{display}</div>
                <div className="text-[28px] font-bold text-text-primary mt-3 tabular-nums">{r.value.toLocaleString()}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 以降のランキング */}
      <section className="glass-panel">
        <p className="t-label mb-3">4位以降</p>
        <table className="data-table">
          <tbody>
            {rows.slice(3).map((r) => {
              const display = r.publicLevel === "public" ? `${r.nickname} (${r.realName})` : r.publicLevel === "nickname_only" ? r.nickname : "非公開";
              return (
                <tr key={r.rank}>
                  <td className="w-12 text-text-tertiary font-mono">{r.rank}</td>
                  <td className="font-medium">{display}</td>
                  <td className="text-right font-bold tabular-nums">{r.value.toLocaleString()}</td>
                </tr>
              );
            })}
            {rows.length <= 3 && (
              <tr>
                <td colSpan={3} className="!py-8 text-center text-text-tertiary">4位以降は記録なし</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <p className="t-xs text-text-tertiary flex items-center gap-1">
        <Trophy className="w-3 h-3" />公開範囲: フルネーム/ニックネームのみ/非公開 は会員設定で管理
      </p>
    </div>
  );
}
