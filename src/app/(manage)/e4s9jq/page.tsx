"use client";

import { useState } from "react";
import Image from "next/image";
import { MessageCircle, Trophy, Coins, Star, Plus, X, Check, DoorOpen } from "lucide-react";

interface RankDef { id: string; name: string; label: string; minVisits: number; color: string; }
interface ChipSetting { unit: string; symbol: string; label: string; prices: { amount: number; price: number }[]; }
interface PointRule { id: string; trigger: string; amount: number; }
interface EntrancePlan { id: string; label: string; price: number; note?: string; }

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

  // エントランス料設定
  const [entranceEnabled, setEntranceEnabled] = useState(true);
  const [entranceRequired, setEntranceRequired] = useState(true);
  const [entrancePlans, setEntrancePlans] = useState<EntrancePlan[]>([
    { id: "ep1", label: "通常", price: 1500, note: "すべての来店客" },
    { id: "ep2", label: "会員(SILVER以上)", price: 1000 },
    { id: "ep3", label: "VIP", price: 0, note: "無料" },
  ]);
  const [entranceSettlementMode, setEntranceSettlementMode] = useState<"prepay" | "on_settlement">("prepay");
  function addEntrancePlan() {
    setEntrancePlans(prev => [...prev, { id: `ep${Date.now()}`, label: "", price: 0 }]);
  }
  function removeEntrancePlan(id: string) {
    setEntrancePlans(prev => prev.filter(p => p.id !== id));
  }

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

  const L = "block t-label mb-2";
  const Card = "glass-panel";
  const SaveBtn = "btn btn-primary btn-sm";

  return (
    <div className="page-stack">
      {/* 店舗情報 */}
      <section className={Card}>
        <p className="t-label mb-4">店舗情報</p>
        <div className="space-y-3">
          <div><label className={L}>店舗名</label><input type="text" defaultValue="Come On Casino" className="text-[13px]" /></div>
          <div><label className={L}>表示名</label><input type="text" defaultValue="カモンカジノ" className="text-[13px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={L}>住所</label><input type="text" placeholder="住所" className="text-[13px]" /></div>
            <div><label className={L}>電話番号</label><input type="tel" placeholder="03-1234-5678" className="text-[13px]" /></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("store")} className={SaveBtn}>保存</button>
            {saved === "store" && <span className="text-[12px] text-status-success flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </section>

      {/* 営業時間 */}
      <section className={Card}>
        <p className="t-label mb-4">営業時間</p>
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
                  closedDays.includes(d) ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-hover"
                }`}>{d}</button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("hours")} className={SaveBtn}>保存</button>
            {saved === "hours" && <span className="text-[12px] text-status-success flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </section>

      {/* ===== ランク設定 ===== */}
      <section className={Card}>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-status-warning" />
          <p className="t-label">ランク設定</p>
        </div>
        <div className="space-y-3">
          <div><label className={L}>ランクの呼び方</label><input type="text" value={rankLabel} onChange={e => setRankLabel(e.target.value)} className="text-[13px] max-w-[200px]" placeholder="例: ランク, グレード, ステータス" /></div>
          <div>
            <label className={L}>ランク一覧</label>
            <div className="space-y-1.5">
              {ranks.map((r, i) => (
                <div key={r.id} className="flex items-center gap-2 bg-bg-hover rounded-[6px] px-3 py-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />
                  <input type="text" value={r.label} onChange={e => setRanks(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} className="text-[13px] bg-transparent border-none flex-1 px-0 py-0 focus:outline-none" />
                  <span className="text-[11px] text-text-tertiary w-16">≥</span>
                  <input type="number" min={0} value={r.minVisits} onChange={e => setRanks(prev => prev.map((x, j) => j === i ? { ...x, minVisits: parseInt(e.target.value) || 0 } : x))} className="text-[12px] w-14 text-center bg-white border border-border rounded-[4px] py-0.5" />
                  <span className="text-[11px] text-text-tertiary">回来店</span>
                  <input type="color" value={r.color} onChange={e => setRanks(prev => prev.map((x, j) => j === i ? { ...x, color: e.target.value } : x))} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
                  {ranks.length > 1 && <button onClick={() => removeRank(r.id)} className="p-0.5 hover:bg-status-danger-bg rounded"><X className="w-3 h-3 text-status-danger" /></button>}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="text" value={newRankName} onChange={e => setNewRankName(e.target.value)} placeholder="新しいランク名" className="text-[13px] flex-1 max-w-[200px]" />
              <button onClick={addRank} className="flex items-center gap-1 px-3 py-[6px] text-[12px] text-accent bg-accent-light rounded-[6px] hover:bg-[#d0ebe4]"><Plus className="w-3 h-3" />追加</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("rank")} className={SaveBtn}>保存</button>
            {saved === "rank" && <span className="text-[12px] text-status-success flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </section>

      {/* ===== チップ設定 ===== */}
      <section className={Card}>
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-4 h-4 text-status-warning" />
          <p className="t-label">チップ設定</p>
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
                  <span className="text-[12px] text-text-tertiary">{chipSetting.unit} =</span>
                  <span className="text-[12px] text-text-tertiary">¥</span>
                  <input type="number" min={0} value={p.price} onChange={e => setChipSetting(prev => ({ ...prev, prices: prev.prices.map((x, j) => j === i ? { ...x, price: parseInt(e.target.value) || 0 } : x) }))} className="text-[13px] w-24 text-right" />
                  <button onClick={() => setChipSetting(prev => ({ ...prev, prices: prev.prices.filter((_, j) => j !== i) }))} className="p-0.5 hover:bg-status-danger-bg rounded"><X className="w-3 h-3 text-status-danger" /></button>
                </div>
              ))}
            </div>
            <button onClick={addChipPrice} className="flex items-center gap-1 mt-2 px-3 py-[6px] text-[12px] text-accent bg-accent-light rounded-[6px] hover:bg-[#d0ebe4]"><Plus className="w-3 h-3" />価格を追加</button>
          </div>
          <div><label className={L}>プレビュー</label><p className="text-[13px] text-text-secondary">{chipSetting.symbol} 5,000{chipSetting.unit}（{chipSetting.label}）</p></div>
          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("chip")} className={SaveBtn}>保存</button>
            {saved === "chip" && <span className="text-[12px] text-status-success flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </section>

      {/* ===== ポイント設定 ===== */}
      <section className={Card}>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-4 h-4 text-accent" />
          <p className="t-label">ポイント設定</p>
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
                <div key={r.id} className="flex items-center gap-2 bg-bg-hover rounded-[6px] px-3 py-2">
                  <input type="text" value={r.trigger} onChange={e => setPointRules(prev => prev.map((x, j) => j === i ? { ...x, trigger: e.target.value } : x))} className="text-[13px] bg-transparent border-none flex-1 px-0 py-0 focus:outline-none" placeholder="条件" />
                  <span className="text-[11px] text-text-tertiary">→</span>
                  <input type="number" min={0} value={r.amount} onChange={e => setPointRules(prev => prev.map((x, j) => j === i ? { ...x, amount: parseInt(e.target.value) || 0 } : x))} className="text-[12px] w-16 text-center bg-white border border-border rounded-[4px] py-0.5" />
                  <span className="text-[11px] text-text-tertiary">{pointUnit}</span>
                  <button onClick={() => setPointRules(prev => prev.filter((_, j) => j !== i))} className="p-0.5 hover:bg-status-danger-bg rounded"><X className="w-3 h-3 text-status-danger" /></button>
                </div>
              ))}
            </div>
            <button onClick={addPointRule} className="flex items-center gap-1 mt-2 px-3 py-[6px] text-[12px] text-accent bg-accent-light rounded-[6px] hover:bg-[#d0ebe4]"><Plus className="w-3 h-3" />ルール追加</button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("point")} className={SaveBtn}>保存</button>
            {saved === "point" && <span className="text-[12px] text-status-success flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </section>

      {/* ===== エントランス料設定 ===== */}
      <section className={Card}>
        <div className="flex items-center gap-2 mb-4">
          <DoorOpen className="w-4 h-4 text-accent" />
          <p className="t-label">エントランス料</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-2 text-[13px] text-text-primary cursor-pointer">
              <input type="checkbox" checked={entranceEnabled} onChange={e => setEntranceEnabled(e.target.checked)} />
              <span>エントランス料を徴収する</span>
            </label>
            {entranceEnabled && (
              <label className="flex items-center gap-2 text-[13px] text-text-primary cursor-pointer">
                <input type="checkbox" checked={entranceRequired} onChange={e => setEntranceRequired(e.target.checked)} />
                <span>入店時に必ず徴収（未徴収は警告表示）</span>
              </label>
            )}
          </div>

          {entranceEnabled && (
            <>
              <div>
                <label className={L}>徴収タイミング</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEntranceSettlementMode("prepay")}
                    className={`px-3 py-[7px] text-[12px] rounded-[6px] border ${entranceSettlementMode === "prepay" ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-hover"}`}
                  >
                    入店時前払い
                  </button>
                  <button
                    onClick={() => setEntranceSettlementMode("on_settlement")}
                    className={`px-3 py-[7px] text-[12px] rounded-[6px] border ${entranceSettlementMode === "on_settlement" ? "bg-accent text-white border-accent" : "border-border text-text-secondary hover:bg-bg-hover"}`}
                  >
                    退店時精算に合算
                  </button>
                </div>
              </div>

              <div>
                <label className={L}>プラン別料金</label>
                <div className="space-y-1.5">
                  {entrancePlans.map((p, i) => (
                    <div key={p.id} className="flex items-center gap-2 bg-bg-hover rounded-[6px] px-3 py-2">
                      <input
                        type="text"
                        value={p.label}
                        onChange={e => setEntrancePlans(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                        placeholder="プラン名"
                        className="text-[13px] bg-transparent border-none flex-1 px-0 py-0 focus:outline-none min-w-0"
                      />
                      <span className="text-[11px] text-text-tertiary">¥</span>
                      <input
                        type="number"
                        min={0}
                        value={p.price}
                        onChange={e => setEntrancePlans(prev => prev.map((x, j) => j === i ? { ...x, price: parseInt(e.target.value) || 0 } : x))}
                        className="text-[12px] w-24 text-right bg-white border border-border rounded-[4px] py-0.5"
                      />
                      <input
                        type="text"
                        value={p.note ?? ""}
                        onChange={e => setEntrancePlans(prev => prev.map((x, j) => j === i ? { ...x, note: e.target.value } : x))}
                        placeholder="備考"
                        className="text-[12px] bg-white border border-border rounded-[4px] px-2 py-0.5 w-40"
                      />
                      {entrancePlans.length > 1 && (
                        <button onClick={() => removeEntrancePlan(p.id)} className="p-0.5 hover:bg-status-danger-bg rounded">
                          <X className="w-3 h-3 text-status-danger" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={addEntrancePlan}
                  className="flex items-center gap-1 mt-2 px-3 py-[6px] text-[12px] text-accent bg-accent-light rounded-[6px] hover:bg-[#d0ebe4]"
                >
                  <Plus className="w-3 h-3" />プラン追加
                </button>
              </div>
            </>
          )}

          <div className="flex items-center gap-2">
            <button onClick={() => showSaved("entrance")} className={SaveBtn}>保存</button>
            {saved === "entrance" && <span className="text-[12px] text-status-success flex items-center gap-1"><Check className="w-3 h-3" />保存しました</span>}
          </div>
        </div>
      </section>

      {/* LINE連携 */}
      <section className={Card}>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="w-4 h-4 text-text-tertiary" />
          <p className="t-label">LINE連携</p>
        </div>
        <div className="space-y-3">
          <div><label className={L}>Channel ID</label><input type="text" placeholder="未設定" className="text-[13px] bg-bg-hover" disabled /></div>
          <div><label className={L}>Channel Secret</label><input type="text" placeholder="未設定" className="text-[13px] bg-bg-hover" disabled /></div>
          <p className="text-[11px] text-text-tertiary">LINE連携は今後のアップデートで対応予定です。</p>
        </div>
      </section>

      {/* フッター */}
      <div className="flex items-center justify-center gap-2 py-4">
        <Image src="/logo-icon.png" alt="みえるくん" width={16} height={16} className="opacity-30" />
        <span className="text-[11px] text-text-tertiary">てんぽみえるくん 店舗設定</span>
      </div>
    </div>
  );
}
