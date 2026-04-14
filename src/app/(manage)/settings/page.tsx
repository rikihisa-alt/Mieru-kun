"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageCircle, Trophy, Coins, Star, Plus, X, Check } from "lucide-react";

interface RankDef { id: string; name: string; label: string; minVisits: number; color: string; }
interface ChipSetting { unit: string; symbol: string; label: string; prices: { amount: number; price: number }[]; }
interface PointRule { id: string; trigger: string; amount: number; }

export default function SettingsPage() {
  const [saved, setSaved] = useState("");
  const [closedDays, setClosedDays] = useState<string[]>(["月"]);

  // ランク設定
  const [ranks, setRanks] = useState<RankDef[]>([
    { id: "r1", name: "regular", label: "レギュラー", minVisits: 0, color: "#9aa0a6" },
    { id: "r2", name: "silver", label: "シルバー", minVisits: 5, color: "#6b7280" },
    { id: "r3", name: "gold", label: "ゴールド", minVisits: 15, color: "#d97706" },
    { id: "r4", name: "vip", label: "VIP", minVisits: 30, color: "#7c3aed" },
  ]);
  const [rankLabel, setRankLabel] = useState("ランク");
  const [newRankName, setNewRankName] = useState("");

  // チップ設定
  const [chipSetting, setChipSetting] = useState<ChipSetting>({
    unit: "枚", symbol: "🎰", label: "チップ",
    prices: [{ amount: 1000, price: 1000 }, { amount: 5000, price: 5000 }, { amount: 10000, price: 10000 }],
  });

  // ポイント設定
  const [pointUnit, setPointUnit] = useState("pt");
  const [pointLabel, setPointLabel] = useState("ポイント");
  const [pointRules, setPointRules] = useState<PointRule[]>([
    { id: "pr1", trigger: "来店", amount: 100 },
    { id: "pr2", trigger: "¥10,000利用", amount: 500 },
    { id: "pr3", trigger: "イベント参加", amount: 200 },
  ]);

  function toggleDay(d: string) {
    setClosedDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  }
  function showSaved(section: string) {
    setSaved(section); setTimeout(() => setSaved(""), 2000);
  }
  function addRank() {
    if (!newRankName.trim()) return;
    setRanks(prev => [...prev, { id: `r${Date.now()}`, name: newRankName.toLowerCase().replace(/\s/g, ""), label: newRankName, minVisits: 0, color: "#5f6368" }]);
    setNewRankName("");
  }
  function removeRank(id: string) { setRanks(prev => prev.filter(r => r.id !== id)); }
  function addChipPrice() { setChipSetting(prev => ({ ...prev, prices: [...prev.prices, { amount: 0, price: 0 }] })); }
  function addPointRule() { setPointRules(prev => [...prev, { id: `pr${Date.now()}`, trigger: "", amount: 0 }]); }

  const L = "block text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider mb-1.5";
  const Card = "pb-5 border-b border-[#e8e4df]";
  const SaveBtn = "px-4 py-[7px] bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69] transition-colors";

  return (
    <div className="space-y-4">
      {/* 店舗情報 */}
      <div className={Card}>
        <h2 className="text-[13px] font-semibold mb-4">店舗情報</h2>
        <div className="space-y-3">
          <div><label className={L}>店舗名</label><input type="text" defaultValue="Come On Casino" className="text-[13px]" /></div>
          <div><label className={L}>表示名</label><input type="text" defaultValue="カモンカジノ" className="text-[13px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={L}>住所</label><input type="text" placeholder="住所" className="text-[13px]" /></div>
            <div><label className={L}>電話番号</label><input type="tel" placeholder="03-1234-5678" className="text-[13px]" /></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("store")} className={SaveBtn}>保存</button>
            {saved === "store" && <span className="text-[12px] text-[#188038] flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </div>

      {/* 営業時間 */}
      <div className={Card}>
        <h2 className="text-[13px] font-semibold mb-4">営業時間</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={L}>開店</label><input type="time" defaultValue="18:00" className="text-[13px]" /></div>
            <div><label className={L}>閉店</label><input type="time" defaultValue="05:00" className="text-[13px]" /></div>
          </div>
          <div>
            <label className={L}>定休日</label>
            <div className="flex gap-1.5">
              {["月","火","水","木","金","土","日"].map(d => (
                <button key={d} onClick={() => toggleDay(d)} className={`w-9 h-9 rounded-[4px] text-[12px] font-medium border transition-colors ${
                  closedDays.includes(d) ? "bg-[#3a8f7c] text-white border-[#3a8f7c]" : "border-[#d8d3cc] text-[#5a6977] hover:bg-[#f3f0ec]"
                }`}>{d}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("hours")} className={SaveBtn}>保存</button>
            {saved === "hours" && <span className="text-[12px] text-[#188038] flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </div>

      {/* ===== ランク設定 ===== */}
      <div className={Card}>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-[#d97706]" />
          <h2 className="text-[13px] font-semibold">ランク設定</h2>
        </div>
        <div className="space-y-3">
          <div><label className={L}>ランクの呼び方</label><input type="text" value={rankLabel} onChange={e => setRankLabel(e.target.value)} className="text-[13px] max-w-[200px]" placeholder="例: ランク, グレード, ステータス" /></div>
          <div>
            <label className={L}>ランク一覧</label>
            <div className="space-y-1.5">
              {ranks.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2 bg-[#faf8f5] rounded-[6px] px-3 py-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                  <input type="text" value={r.label} onChange={e => setRanks(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="text-[13px] bg-transparent border-none flex-1 px-0 py-0 focus:outline-none" />
                  <span className="text-[11px] text-[#8e9baa] w-16">≥</span>
                  <input type="number" min={0} value={r.minVisits} onChange={e => setRanks(prev => prev.map((x, j) => j === i ? { ...x, minVisits: parseInt(e.target.value) || 0 } : x))} className="text-[12px] w-14 text-center bg-white border border-[#d8d3cc] rounded-[4px] py-0.5" />
                  <span className="text-[11px] text-[#8e9baa]">回来店</span>
                  <input type="color" value={r.color} onChange={e => setRanks(prev => prev.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                  {ranks.length > 1 && <button onClick={() => removeRank(r.id)} className="p-0.5 hover:bg-[#fce8e6] rounded"><X className="w-3 h-3 text-[#c5221f]" /></button>}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="text" value={newRankName} onChange={e => setNewRankName(e.target.value)} placeholder="新しいランク名" className="text-[13px] flex-1 max-w-[200px]" />
              <button onClick={addRank} className="flex items-center gap-1 px-3 py-[6px] text-[12px] text-[#3a8f7c] bg-[#e8f5f0] rounded-[6px] hover:bg-[#d0ebe4]"><Plus className="w-3 h-3" />追加</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("rank")} className={SaveBtn}>保存</button>
            {saved === "rank" && <span className="text-[12px] text-[#188038] flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </div>

      {/* ===== チップ設定 ===== */}
      <div className={Card}>
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-4 h-4 text-[#d97706]" />
          <h2 className="text-[13px] font-semibold">チップ設定</h2>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div><label className={L}>呼び方</label><input type="text" value={chipSetting.label} onChange={e => setChipSetting(p => ({ ...p, label: e.target.value }))} className="text-[13px]" placeholder="例: チップ, コイン" /></div>
            <div><label className={L}>単位</label><input type="text" value={chipSetting.unit} onChange={e => setChipSetting(p => ({ ...p, unit: e.target.value }))} className="text-[13px]" placeholder="例: 枚, コイン" /></div>
            <div><label className={L}>表記マーク</label><input type="text" value={chipSetting.symbol} onChange={e => setChipSetting(p => ({ ...p, symbol: e.target.value }))} className="text-[13px]" placeholder="例: 🎰, ◆" /></div>
          </div>
          <div>
            <label className={L}>値段設定（購入メニュー）</label>
            <div className="space-y-1.5">
              {chipSetting.prices.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="number" min={0} value={p.amount} onChange={e => setChipSetting(prev => ({ ...prev, prices: prev.prices.map((x, j) => j === i ? { ...x, amount: parseInt(e.target.value) || 0 } : x) }))} className="text-[13px] w-24 text-right" />
                  <span className="text-[12px] text-[#8e9baa]">{chipSetting.unit} =</span>
                  <span className="text-[12px] text-[#8e9baa]">¥</span>
                  <input type="number" min={0} value={p.price} onChange={e => setChipSetting(prev => ({ ...prev, prices: prev.prices.map((x, j) => j === i ? { ...x, price: parseInt(e.target.value) || 0 } : x) }))} className="text-[13px] w-24 text-right" />
                  <button onClick={() => setChipSetting(prev => ({ ...prev, prices: prev.prices.filter((_, j) => j !== i) }))} className="p-0.5 hover:bg-[#fce8e6] rounded"><X className="w-3 h-3 text-[#c5221f]" /></button>
                </div>
              ))}
            </div>
            <button onClick={addChipPrice} className="flex items-center gap-1 mt-2 px-3 py-[6px] text-[12px] text-[#3a8f7c] bg-[#e8f5f0] rounded-[6px] hover:bg-[#d0ebe4]"><Plus className="w-3 h-3" />価格を追加</button>
          </div>
          <div><label className={L}>プレビュー</label><p className="text-[13px] text-[#5a6977]">{chipSetting.symbol} 5,000{chipSetting.unit}（{chipSetting.label}）</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("chip")} className={SaveBtn}>保存</button>
            {saved === "chip" && <span className="text-[12px] text-[#188038] flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </div>

      {/* ===== ポイント設定 ===== */}
      <div className={Card}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-[#3a8f7c]" />
          <h2 className="text-[13px] font-semibold">ポイント設定</h2>
        </div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className={L}>呼び方</label><input type="text" value={pointLabel} onChange={e => setPointLabel(e.target.value)} className="text-[13px]" placeholder="例: ポイント, マイル" /></div>
            <div><label className={L}>単位</label><input type="text" value={pointUnit} onChange={e => setPointUnit(e.target.value)} className="text-[13px]" placeholder="例: pt, P, マイル" /></div>
          </div>
          <div>
            <label className={L}>付与ルール</label>
            <div className="space-y-1.5">
              {pointRules.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2 bg-[#faf8f5] rounded-[6px] px-3 py-2">
                  <input type="text" value={r.trigger} onChange={e => setPointRules(prev => prev.map((x, j) => j === i ? { ...x, trigger: e.target.value } : x))} className="text-[13px] bg-transparent border-none flex-1 px-0 py-0 focus:outline-none" placeholder="条件" />
                  <span className="text-[11px] text-[#8e9baa]">→</span>
                  <input type="number" min={0} value={r.amount} onChange={e => setPointRules(prev => prev.map((x, j) => j === i ? { ...x, amount: parseInt(e.target.value) || 0 } : x))} className="text-[12px] w-16 text-center bg-white border border-[#d8d3cc] rounded-[4px] py-0.5" />
                  <span className="text-[11px] text-[#8e9baa]">{pointUnit}</span>
                  <button onClick={() => setPointRules(prev => prev.filter((_, j) => j !== i))} className="p-0.5 hover:bg-[#fce8e6] rounded"><X className="w-3 h-3 text-[#c5221f]" /></button>
                </div>
              ))}
            </div>
            <button onClick={addPointRule} className="flex items-center gap-1 mt-2 px-3 py-[6px] text-[12px] text-[#3a8f7c] bg-[#e8f5f0] rounded-[6px] hover:bg-[#d0ebe4]"><Plus className="w-3 h-3" />ルール追加</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("point")} className={SaveBtn}>保存</button>
            {saved === "point" && <span className="text-[12px] text-[#188038] flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </div>

      {/* LINE連携 */}
      <div className={Card}>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-[#8e9baa]" />
          <h2 className="text-[13px] font-semibold">LINE連携</h2>
        </div>
        <div className="space-y-3">
          <div><label className={L}>Channel ID</label><input type="text" placeholder="未設定" className="text-[13px] bg-[#faf8f5]" disabled /></div>
          <div><label className={L}>Channel Secret</label><input type="text" placeholder="未設定" className="text-[13px] bg-[#faf8f5]" disabled /></div>
          <p className="text-[11px] text-[#8e9baa]">LINE連携は今後のアップデートで対応予定です。</p>
        </div>
      </div>

      {/* フッター */}
      <div className="flex items-center justify-center gap-2 py-4">
        <Image src="/logo-icon.png" alt="みえるくん" width={16} height={16} className="opacity-30" />
        <span className="text-[11px] text-[#8e9baa]">てんぽみえるくん 店舗設定</span>
      </div>
    </div>
  );
}
