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
    <div className="space-y-4 max-w-4xl">
      {/* セレクタ */}
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

      {/* Top3カード */}
      <div className="grid grid-cols-3 gap-3">
        {rows.slice(0, 3).map((r) => {
          const display = r.publicLevel === "public" ? `${r.nickname} (${r.realName})` : r.publicLevel === "nickname_only" ? r.nickname : "非公開";
          const podiumColor = r.rank === 1 ? "#d97706" : r.rank === 2 ? "#6b7280" : "#a16207";
          return (
            <div key={r.rank} className="border border-border-light rounded-[8px] p-4 text-center bg-gradient-to-b from-bg-hover to-white">
              <Medal className="w-6 h-6 mx-auto mb-1" style={{ color: podiumColor }} />
              <div className="text-[11px] text-text-tertiary font-semibold tracking-wider">{r.rank === 1 ? "GOLD" : r.rank === 2 ? "SILVER" : "BRONZE"}</div>
              <div className="text-[15px] font-bold text-text-primary mt-1">{display}</div>
              <div className="text-[20px] font-bold text-text-primary mt-2">{r.value.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      {/* 以降のランキング */}
      <div>
        <h3 className="t-subhead mb-2">4位以降</h3>
        <table className="w-full text-[13px]">
          <tbody>
            {rows.slice(3).map((r) => {
              const display = r.publicLevel === "public" ? `${r.nickname} (${r.realName})` : r.publicLevel === "nickname_only" ? r.nickname : "非公開";
              return (
                <tr key={r.rank} className="border-b border-border-light">
                  <td className="px-3 py-2 w-10 text-text-tertiary font-mono">{r.rank}</td>
                  <td className="px-3 py-2 font-medium">{display}</td>
                  <td className="px-3 py-2 text-right font-bold">{r.value.toLocaleString()}</td>
                </tr>
              );
            })}
            {rows.length <= 3 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-text-tertiary text-[12px]">4位以降は記録なし</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pt-2 text-[11px] text-text-tertiary flex items-center gap-1">
        <Trophy className="w-3 h-3" />公開範囲: フルネーム/ニックネームのみ/非公開 は会員設定で管理
      </div>
    </div>
  );
}
