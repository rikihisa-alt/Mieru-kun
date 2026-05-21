"use client";

import { useState, useMemo } from "react";
import { Trophy, Medal, Settings2, RotateCcw } from "lucide-react";

type Metric = "visits" | "points" | "ring_net" | "tournaments" | "multike" | "sns";
type Tab = Metric | "total";
type Period = "monthly" | "season" | "all_time";

const METRIC_LABEL: Record<Metric, string> = {
  visits: "来店回数",
  points: "来店ポイント",
  ring_net: "リング純増",
  tournaments: "トナメ参加",
  multike: "マルチケ獲得",
  sns: "SNS投稿",
};
const METRIC_UNIT: Record<Metric, string> = {
  visits: "回", points: "pt", ring_net: "枚", tournaments: "回", multike: "枚", sns: "回",
};
const PERIOD_LABEL: Record<Period, string> = {
  monthly: "月間",
  season: "シーズン",
  all_time: "通期",
};

const METRICS: Metric[] = ["visits", "points", "ring_net", "tournaments", "multike", "sns"];

interface Player {
  id: string;
  nickname: string;
  realName: string;
  publicLevel: "public" | "nickname_only" | "private";
  values: Record<Metric, number>;
}

// デモデータ: 1人ごとに全メトリクスの値を保持
const PLAYERS: Player[] = [];

// 総合スコアの既定係数
const DEFAULT_WEIGHTS: Record<Metric, number> = {
  visits: 10,       // 1来店 = 10pt
  points: 1,        // 1pt = 1pt
  ring_net: 0.1,    // 100枚純増 = 10pt
  tournaments: 20,  // 1トナメ参加 = 20pt
  multike: 5,       // 1マルチケ獲得 = 5pt
  sns: 15,          // 1投稿 = 15pt
};

function displayName(p: Player): string {
  if (p.publicLevel === "public") return `${p.nickname} (${p.realName})`;
  if (p.publicLevel === "nickname_only") return p.nickname;
  return "非公開";
}

export default function RankingPage() {
  const [tab, setTab] = useState<Tab>("total");
  const [period, setPeriod] = useState<Period>("monthly");
  const [weights, setWeights] = useState<Record<Metric, number>>(DEFAULT_WEIGHTS);
  const [showWeightsEditor, setShowWeightsEditor] = useState(false);

  // 各メトリクスのランキング
  const metricRows = useMemo(() => {
    if (tab === "total") return [];
    const m = tab as Metric;
    return [...PLAYERS]
      .map(p => ({ ...p, value: p.values[m] }))
      .sort((a, b) => b.value - a.value)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [tab]);

  // 総合スコアの計算
  const totalRows = useMemo(() => {
    return [...PLAYERS]
      .map(p => {
        const score = METRICS.reduce((s, m) => s + p.values[m] * weights[m], 0);
        const breakdown = METRICS.map(m => ({ metric: m, contribution: p.values[m] * weights[m] }));
        return { ...p, value: Math.round(score), breakdown };
      })
      .sort((a, b) => b.value - a.value)
      .map((p, i) => ({ ...p, rank: i + 1 }));
  }, [weights]);

  const rows = tab === "total" ? totalRows : metricRows;

  return (
    <div className="page-stack">
      {/* セレクタ */}
      <section>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="tabs">
            <button onClick={() => setTab("total")} className={`tab ${tab === "total" ? "tab-active" : ""}`}>
              <Trophy className="w-3 h-3 inline mr-1" />総合
            </button>
            {METRICS.map(m => (
              <button key={m} onClick={() => setTab(m)} className={`tab ${tab === m ? "tab-active" : ""}`}>
                {METRIC_LABEL[m]}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="tabs">
              {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
                <button key={p} onClick={() => setPeriod(p)} className={`tab ${period === p ? "tab-active" : ""}`}>
                  {PERIOD_LABEL[p]}
                </button>
              ))}
            </div>
            {tab === "total" && (
              <button onClick={() => setShowWeightsEditor(v => !v)} className="btn btn-subtle btn-sm">
                <Settings2 className="w-3.5 h-3.5" />係数
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 係数エディタ(総合タブ時) */}
      {tab === "total" && showWeightsEditor && (
        <section className="glass-panel">
          <div className="flex items-center justify-between mb-3">
            <p className="t-label">総合スコア係数</p>
            <button
              onClick={() => setWeights(DEFAULT_WEIGHTS)}
              className="btn btn-ghost btn-xs"
              title="既定値に戻す"
            >
              <RotateCcw className="w-3 h-3" />既定値
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {METRICS.map(m => (
              <div key={m} className="flex items-center gap-2 bg-bg-hover rounded-[6px] px-3 py-2">
                <span className="text-[12px] font-medium text-text-primary flex-1 truncate">{METRIC_LABEL[m]}</span>
                <span className="text-[11px] text-text-tertiary">×</span>
                <input
                  type="number"
                  step={0.1}
                  value={weights[m]}
                  onChange={e => setWeights(w => ({ ...w, [m]: parseFloat(e.target.value) || 0 }))}
                  className="w-20 text-[12px] text-right bg-white border border-border rounded-[4px] px-2 py-0.5"
                />
              </div>
            ))}
          </div>
          <p className="t-xs text-text-tertiary mt-3">
            総合スコア = Σ(各項目の値 × 係数)。0を入れるとその項目は総合から除外されます。
          </p>
        </section>
      )}

      {/* Top3カード */}
      <section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {rows.slice(0, 3).map((r) => {
            const podiumLabel = r.rank === 1 ? "GOLD" : r.rank === 2 ? "SILVER" : "BRONZE";
            const podiumColor = r.rank === 1 ? "#d97706" : r.rank === 2 ? "#6b7280" : "#a16207";
            const chipClass = r.rank === 1 ? "chip-gold" : r.rank === 2 ? "chip-neutral" : "chip-warning";
            const unit = tab === "total" ? "pt" : METRIC_UNIT[tab as Metric];
            return (
              <div key={r.id} className="glass-panel text-center" style={{ padding: 24 }}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Medal className="w-5 h-5" style={{ color: podiumColor }} />
                  <span className={`chip ${chipClass} chip-sm`}>{podiumLabel}</span>
                </div>
                <div className="text-[16px] font-semibold text-text-primary">{displayName(r)}</div>
                <div className="text-[28px] font-bold text-text-primary mt-3 tabular-nums">
                  {r.value.toLocaleString()}
                  <span className="text-[14px] text-text-tertiary ml-1">{unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4位以降 */}
      <section className="glass-panel">
        <p className="t-label mb-3">4位以降</p>
        <table className="data-table">
          <tbody>
            {rows.slice(3).map((r) => (
              <tr key={r.id}>
                <td className="w-12 text-text-tertiary font-mono">{r.rank}</td>
                <td className="font-medium">{displayName(r)}</td>
                <td className="text-right font-bold tabular-nums">
                  {r.value.toLocaleString()}
                  <span className="text-[11px] text-text-tertiary ml-1">{tab === "total" ? "pt" : METRIC_UNIT[tab as Metric]}</span>
                </td>
              </tr>
            ))}
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
