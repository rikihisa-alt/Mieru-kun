"use client";

import { useCallback } from "react";
import { usePersisted, usePersistedState } from "@/lib/persist/store";
import { settingsStore, type EntrancePlan, type CustomerRank } from "@/lib/store/domain-stores";
import { toHalfWidthNumber } from "@/lib/v2/points";
import { RANK_RULES_KEY, DEFAULT_RANK_RULES, type RankRules, type RankTierRule } from "@/lib/v2/rank";
import { PageHeader, Btn, Panel, Field, VStack, HStack, Toast, useToast } from "@/components/v2/ui";
import { Plus, X } from "lucide-react";

const RANK_TIER_LABEL: Record<Exclude<CustomerRank, "regular">, string> = { silver: "Silver", gold: "Gold", vip: "VIP" };
const RANK_TIER_KEYS: Exclude<CustomerRank, "regular">[] = ["silver", "gold", "vip"];

/** 不正な数値(負数・NaN)を 0以上の整数へ丸める */
function sanitizeNonNegativeInt(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.trunc(v));
}

// =================================================================
// 時間課金 (テーブルチャージ / 時間制プレイ料金)
// =================================================================
export interface TimeChargeSettings {
  enabled: boolean;
  unitMinutes: 30 | 60;       // 課金方式: 30分単位 or 60分単位
  unitPrice: number;          // 単価(円/単位)
  rounding: "ceil" | "floor"; // 端数の扱い: 切り上げ / 切り捨て
}
export const DEFAULT_TIME_CHARGE: TimeChargeSettings = {
  enabled: false,
  unitMinutes: 30,
  unitPrice: 500,
  rounding: "ceil",
};
export const TIME_CHARGE_KEY = "settings_time_charge_v1";

/** 滞在分数から時間課金の単位数を算出 (端数処理を適用) */
export function calcTimeChargeUnits(stayMinutes: number, cfg: TimeChargeSettings): number {
  const m = Math.max(0, stayMinutes);
  const raw = m / cfg.unitMinutes;
  return cfg.rounding === "ceil" ? Math.ceil(raw) : Math.floor(raw);
}
/** 滞在分数から時間課金の金額を算出 */
export function calcTimeChargeAmount(stayMinutes: number, cfg: TimeChargeSettings): number {
  return calcTimeChargeUnits(stayMinutes, cfg) * cfg.unitPrice;
}

export default function SettingsPage() {
  const [s, setS] = usePersisted(settingsStore);
  const [tc, setTc] = usePersistedState<TimeChargeSettings>(TIME_CHARGE_KEY, DEFAULT_TIME_CHARGE);
  const [rankRules, setRankRules] = usePersistedState<RankRules>(RANK_RULES_KEY, DEFAULT_RANK_RULES);
  const { toast, show: showToast } = useToast(1800);

  const showSaved = useCallback((msg = "保存しました") => {
    showToast(msg);
  }, [showToast]);

  function up<K extends keyof typeof s>(k: K, v: typeof s[K]) { setS({ ...s, [k]: v }); showSaved(); }
  function upTc<K extends keyof TimeChargeSettings>(k: K, v: TimeChargeSettings[K]) { setTc({ ...tc, [k]: v }); showSaved(); }
  /** 単価入力: 全角数字対応。不正値(負数/NaN)は0以上に丸めて保存 */
  function upTcUnitPrice(raw: string) {
    const n = sanitizeNonNegativeInt(toHalfWidthNumber(raw));
    upTc("unitPrice", n);
  }
  function upRankTier<K extends keyof RankTierRule>(tier: Exclude<CustomerRank, "regular">, k: K, v: RankTierRule[K]) {
    setRankRules({ ...rankRules, [tier]: { ...rankRules[tier], [k]: v } });
    showSaved();
  }
  function addPlan() {
    up("entrancePlans", [...s.entrancePlans, { id: `ep${Date.now()}`, label: "", price: 0 }]);
  }
  function removePlan(id: string) {
    up("entrancePlans", s.entrancePlans.filter(p => p.id !== id));
  }
  function updPlan(id: string, patch: Partial<EntrancePlan>) {
    up("entrancePlans", s.entrancePlans.map(p => p.id === id ? { ...p, ...patch } : p));
  }
  /** 価格などの数値入力: 不正値(負数/NaN)は0以上に丸めて保存 */
  function updPlanPrice(id: string, raw: number) {
    const safe = sanitizeNonNegativeInt(raw);
    if (safe !== raw) showSaved("負の値は入力できないため0以上に調整しました");
    updPlan(id, { price: safe });
  }

  return (
    <VStack gap={16}>
      <PageHeader title="店舗設定" />

      {toast && <Toast message={toast.message} variant={toast.variant} />}

      <Panel title="店舗情報">
        <div className="v2-form-grid">
          <Field label="店舗名"><input value={s.storeName} onChange={(e) => up("storeName", e.target.value)} /></Field>
          <Field label="表示名"><input value={s.displayName} onChange={(e) => up("displayName", e.target.value)} /></Field>
          <Field label="住所"><input value={s.address} onChange={(e) => up("address", e.target.value)} /></Field>
          <Field label="電話"><input value={s.phone} onChange={(e) => up("phone", e.target.value)} /></Field>
        </div>
      </Panel>

      <Panel title="営業時間">
        <div className="v2-form-grid">
          <Field label="開店"><input type="time" value={s.openTime} onChange={(e) => up("openTime", e.target.value)} /></Field>
          <Field label="閉店"><input type="time" value={s.closeTime} onChange={(e) => up("closeTime", e.target.value)} /></Field>
        </div>
        <Field label="定休日">
          <HStack gap={4}>
            {["月","火","水","木","金","土","日"].map(d => {
              const active = s.closedDays.includes(d);
              return (
                <Btn key={d} variant={active ? "selected" : "default"}
                  onClick={() => up("closedDays", active ? s.closedDays.filter(x => x !== d) : [...s.closedDays, d])}
                  style={{ width: 36, padding: 0 }}>{d}</Btn>
              );
            })}
          </HStack>
        </Field>
      </Panel>

      <Panel title="エントランス料">
        <VStack gap={12}>
          <HStack gap={16}>
            <label className="v2-row" style={{ gap: 6 }}>
              <input type="checkbox" checked={s.entranceEnabled} onChange={(e) => up("entranceEnabled", e.target.checked)} style={{ width: 14, height: 14 }} />
              徴収する
            </label>
            {s.entranceEnabled && (
              <label className="v2-row" style={{ gap: 6 }}>
                <input type="checkbox" checked={s.entranceRequired} onChange={(e) => up("entranceRequired", e.target.checked)} style={{ width: 14, height: 14 }} />
                必須(未徴収警告)
              </label>
            )}
          </HStack>
          {s.entranceEnabled && (
            <>
              <Field label="徴収タイミング">
                <HStack gap={6} style={{ flexWrap: "wrap" }}>
                  <Btn variant={s.entranceSettlementMode === "prepay" ? "selected" : "default"} onClick={() => up("entranceSettlementMode", "prepay")}>入店時前払い</Btn>
                  <Btn variant={s.entranceSettlementMode === "on_settlement" ? "selected" : "default"} onClick={() => up("entranceSettlementMode", "on_settlement")}>退店時合算</Btn>
                </HStack>
              </Field>
              <div>
                <div className="v2-label" style={{ marginBottom: 6 }}>プラン</div>
                <VStack gap={6}>
                  {s.entrancePlans.map(p => (
                    <HStack key={p.id} gap={6} style={{ flexWrap: "wrap" }}>
                      <input value={p.label} onChange={(e) => updPlan(p.id, { label: e.target.value })} placeholder="プラン名" style={{ flex: "1 1 120px" }} />
                      <span className="v2-mute" style={{ fontSize: 12 }}>¥</span>
                      <input type="number" min={0} value={p.price} onChange={(e) => updPlanPrice(p.id, parseInt(e.target.value) || 0)} style={{ width: 100, textAlign: "right" }} />
                      <input value={p.note ?? ""} onChange={(e) => updPlan(p.id, { note: e.target.value })} placeholder="備考" style={{ flex: "1 1 160px" }} />
                      <Btn size="xs" variant="danger" onClick={() => removePlan(p.id)}><X size={11} /></Btn>
                    </HStack>
                  ))}
                  <Btn size="sm" onClick={addPlan}><Plus size={12} /> プラン追加</Btn>
                </VStack>
              </div>
            </>
          )}
        </VStack>
      </Panel>

      <Panel title="時間課金">
        <VStack gap={12}>
          <label className="v2-row" style={{ gap: 6 }}>
            <input type="checkbox" checked={tc.enabled} onChange={(e) => upTc("enabled", e.target.checked)} style={{ width: 14, height: 14 }} />
            テーブルチャージ(時間制プレイ料金)を有効にする
          </label>
          {tc.enabled && (
            <>
              <Field label="課金方式">
                <HStack gap={6} style={{ flexWrap: "wrap" }}>
                  <Btn variant={tc.unitMinutes === 30 ? "selected" : "default"} onClick={() => upTc("unitMinutes", 30)}>30分単位</Btn>
                  <Btn variant={tc.unitMinutes === 60 ? "selected" : "default"} onClick={() => upTc("unitMinutes", 60)}>60分単位</Btn>
                </HStack>
              </Field>
              <Field label={`単価(円 / ${tc.unitMinutes}分)`}>
                <HStack gap={6}>
                  <span className="v2-mute" style={{ fontSize: 12 }}>¥</span>
                  <input inputMode="numeric" value={tc.unitPrice} onChange={(e) => upTcUnitPrice(e.target.value)} style={{ width: 120, textAlign: "right" }} />
                </HStack>
              </Field>
              <Field label="端数の扱い" hint="滞在時間が単位に満たない場合の丸め方">
                <HStack gap={6} style={{ flexWrap: "wrap" }}>
                  <Btn variant={tc.rounding === "ceil" ? "selected" : "default"} onClick={() => upTc("rounding", "ceil")}>切り上げ</Btn>
                  <Btn variant={tc.rounding === "floor" ? "selected" : "default"} onClick={() => upTc("rounding", "floor")}>切り捨て</Btn>
                </HStack>
              </Field>
            </>
          )}
        </VStack>
      </Panel>

      <Panel title="ポイント設定">
        <div className="v2-form-grid">
          <Field label="呼び方"><input value={s.pointLabel} onChange={(e) => up("pointLabel", e.target.value)} /></Field>
          <Field label="単位"><input value={s.pointUnit} onChange={(e) => up("pointUnit", e.target.value)} /></Field>
        </div>
      </Panel>

      <Panel title="会員ランク自動判定">
        <VStack gap={16}>
          <div className="v2-mute" style={{ fontSize: 11, lineHeight: 1.6 }}>
            来店回数・累計利用額がしきい値を満たした顧客を対象ランクへ自動昇格させます(顧客一覧の「ランク自動判定」から実行)。降格はしません。手動でランクを上げた顧客が下がることもありません。
          </div>
          {RANK_TIER_KEYS.map(tier => {
            const r = rankRules[tier];
            return (
              <div key={tier} className="v2-panel" style={{ background: "var(--v2-accent-soft)", borderStyle: "dashed" }}>
                <div className="v2-panel-body">
                  <VStack gap={10}>
                    <HStack gap={16}>
                      <span className="v2-h2" style={{ fontSize: 14 }}>{RANK_TIER_LABEL[tier]}</span>
                      <label className="v2-row" style={{ gap: 6, marginLeft: "auto" }}>
                        <input type="checkbox" checked={r.isActive} onChange={(e) => upRankTier(tier, "isActive", e.target.checked)} style={{ width: 14, height: 14 }} />
                        有効
                      </label>
                    </HStack>
                    {r.isActive && (
                      <>
                        <div className="v2-form-grid">
                          <Field label="来店回数(回以上)" hint="0で条件なし">
                            <input inputMode="numeric" value={r.minVisits} onChange={(e) => upRankTier(tier, "minVisits", toHalfWidthNumber(e.target.value))} placeholder="例: 5" />
                          </Field>
                          <Field label="累計利用額(円以上)" hint="0で条件なし">
                            <input inputMode="numeric" value={r.minSpent} onChange={(e) => upRankTier(tier, "minSpent", toHalfWidthNumber(e.target.value))} placeholder="例: 30000" />
                          </Field>
                        </div>
                        <Field label="条件の組み合わせ" hint="両方の条件を設定した場合の判定方法">
                          <HStack gap={6} style={{ flexWrap: "wrap" }}>
                            <Btn variant={r.combinator === "or" ? "selected" : "default"} onClick={() => upRankTier(tier, "combinator", "or")}>どちらか満たす</Btn>
                            <Btn variant={r.combinator === "and" ? "selected" : "default"} onClick={() => upRankTier(tier, "combinator", "and")}>両方満たす</Btn>
                          </HStack>
                        </Field>
                      </>
                    )}
                  </VStack>
                </div>
              </div>
            );
          })}
        </VStack>
      </Panel>
    </VStack>
  );
}
