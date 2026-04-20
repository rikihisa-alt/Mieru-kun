"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Sparkles, Calendar } from "lucide-react";

interface Rule {
  id: string;
  name: string;
  points: number;
  conditionText: string;
  isActive: boolean;
  priority: number;
  startsAt?: string;
  endsAt?: string;
  description?: string;
}

const INIT: Rule[] = [
  { id: "r1", name: "通常来店", points: 10, conditionText: "来店時", isActive: true, priority: 100, description: "毎回の来店で付与" },
  { id: "r2", name: "平日来店ボーナス", points: 5, conditionText: "来店 AND 平日", isActive: true, priority: 90, description: "月〜金の来店に追加" },
  { id: "r3", name: "初回紹介ボーナス", points: 100, conditionText: "紹介先が初来店", isActive: true, priority: 80, description: "紹介された会員の初来店時、紹介者に付与" },
  { id: "r4", name: "月間10回来店達成", points: 50, conditionText: "月間来店回数 >= 10", isActive: true, priority: 70, description: "その月の10回目来店時" },
  { id: "r5", name: "イベント参加", points: 30, conditionText: "event.status = attended", isActive: true, priority: 60, description: "イベント参加時" },
  { id: "r6", name: "春季限定キャンペーン", points: 20, conditionText: "来店 AND 期間内", isActive: false, priority: 50, startsAt: "2026-03-01", endsAt: "2026-05-31", description: "春キャンペーン期間のみ" },
];

export default function PointRulesPage() {
  const [rules, setRules] = useState<Rule[]>(INIT);

  function toggle(id: string) {
    setRules((p) => p.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r)));
  }
  function remove(id: string) {
    if (!window.confirm("削除しますか？")) return;
    setRules((p) => p.filter((r) => r.id !== id));
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#5a6977]">{rules.filter(r => r.isActive).length}件がアクティブ / 全{rules.length}件</p>
        <button className="flex items-center gap-1 px-3 py-[7px] bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69]">
          <Plus className="w-3.5 h-3.5" />ルール追加
        </button>
      </div>

      <div className="px-4 py-3 bg-[#fdf4e8] border border-[#c87b1a]/20 rounded-[6px] text-[12px] text-[#8a5a10] flex items-start gap-2">
        <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          ポイントルールは <strong>条件 + 加算値</strong> の形で登録できます。変更は即時反映されますが、既存の付与履歴は遡及しません。
        </div>
      </div>

      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[#e8e4df]">
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left w-12">優先度</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">ルール</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">条件</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">加算</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">期間</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">状態</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left"></th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id} className="border-b border-[#f3f0ec] hover:bg-[#faf8f5]">
              <td className="px-3 py-2.5 font-mono text-[11px] text-[#8e9baa]">{r.priority}</td>
              <td className="px-3 py-2.5">
                <div className="font-medium">{r.name}</div>
                {r.description && <div className="text-[11px] text-[#8e9baa]">{r.description}</div>}
              </td>
              <td className="px-3 py-2.5 font-mono text-[11px] text-[#5a6977]">{r.conditionText}</td>
              <td className="px-3 py-2.5 font-bold text-[#3a8f7c]">+{r.points}</td>
              <td className="px-3 py-2.5 text-[11px] text-[#5a6977]">
                {r.startsAt ? (<><Calendar className="w-3 h-3 inline mr-0.5" />{r.startsAt.slice(5)}〜{r.endsAt?.slice(5) ?? "無期限"}</>) : "無期限"}
              </td>
              <td className="px-3 py-2.5">
                <button onClick={() => toggle(r.id)} className={`text-[11px] font-medium px-2 py-0.5 rounded-[3px] ${r.isActive ? "bg-[#e8f5f0] text-[#2e7d5b]" : "bg-[#f3f0ec] text-[#8e9baa]"}`}>
                  {r.isActive ? "有効" : "停止中"}
                </button>
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-[#f3f0ec] rounded text-[#5a6977]"><Pencil className="w-3 h-3" /></button>
                  <button onClick={() => remove(r.id)} className="p-1 hover:bg-[#fce8e6] rounded text-[#c5221f]"><Trash2 className="w-3 h-3" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
