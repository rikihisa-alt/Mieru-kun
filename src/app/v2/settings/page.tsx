"use client";

import { useState, useRef, useCallback } from "react";
import { usePersisted } from "@/lib/persist/store";
import { settingsStore, type EntrancePlan } from "@/lib/store/domain-stores";
import { PageHeader, Btn, Panel, Field, VStack, HStack } from "@/components/v2/ui";
import { Plus, X, Check } from "lucide-react";

/** 不正な数値(負数・NaN)を 0以上の整数へ丸める */
function sanitizeNonNegativeInt(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.trunc(v));
}

export default function SettingsPage() {
  const [s, setS] = usePersisted(settingsStore);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSaved = useCallback((msg = "保存しました") => {
    setToastMsg(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(null), 1800);
  }, []);

  function up<K extends keyof typeof s>(k: K, v: typeof s[K]) { setS({ ...s, [k]: v }); showSaved(); }
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

      {toastMsg && (
        <div
          role="status"
          style={{
            position: "fixed", top: 16, right: 16, zIndex: 1000,
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 16px", borderRadius: "var(--v2-radius-md, 8px)",
            background: "var(--v2-text, #1c2e24)", color: "#fff",
            fontSize: 13, fontWeight: 600,
            boxShadow: "var(--v2-shadow-lg, 0 8px 24px rgba(0,0,0,0.2))",
            animation: "v2-fade-in 0.15s ease-out",
          }}
        >
          <Check size={14} />
          {toastMsg}
        </div>
      )}

      <Panel title="店舗情報">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="店舗名"><input value={s.storeName} onChange={(e) => up("storeName", e.target.value)} /></Field>
          <Field label="表示名"><input value={s.displayName} onChange={(e) => up("displayName", e.target.value)} /></Field>
          <Field label="住所"><input value={s.address} onChange={(e) => up("address", e.target.value)} /></Field>
          <Field label="電話"><input value={s.phone} onChange={(e) => up("phone", e.target.value)} /></Field>
        </div>
      </Panel>

      <Panel title="営業時間">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="開店"><input type="time" value={s.openTime} onChange={(e) => up("openTime", e.target.value)} /></Field>
          <Field label="閉店"><input type="time" value={s.closeTime} onChange={(e) => up("closeTime", e.target.value)} /></Field>
        </div>
        <Field label="定休日">
          <HStack gap={4}>
            {["月","火","水","木","金","土","日"].map(d => {
              const active = s.closedDays.includes(d);
              return (
                <button key={d} onClick={() => up("closedDays", active ? s.closedDays.filter(x => x !== d) : [...s.closedDays, d])}
                  className={`v2-btn ${active ? "v2-btn-primary" : ""}`} style={{ width: 36, padding: 0 }}>{d}</button>
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
                <HStack gap={6}>
                  <button onClick={() => up("entranceSettlementMode", "prepay")} className={`v2-btn ${s.entranceSettlementMode === "prepay" ? "v2-btn-primary" : ""}`}>入店時前払い</button>
                  <button onClick={() => up("entranceSettlementMode", "on_settlement")} className={`v2-btn ${s.entranceSettlementMode === "on_settlement" ? "v2-btn-primary" : ""}`}>退店時合算</button>
                </HStack>
              </Field>
              <div>
                <div className="v2-label" style={{ marginBottom: 6 }}>プラン</div>
                <VStack gap={6}>
                  {s.entrancePlans.map(p => (
                    <HStack key={p.id} gap={6}>
                      <input value={p.label} onChange={(e) => updPlan(p.id, { label: e.target.value })} placeholder="プラン名" style={{ flex: 1 }} />
                      <span className="v2-mute" style={{ fontSize: 12 }}>¥</span>
                      <input type="number" min={0} value={p.price} onChange={(e) => updPlanPrice(p.id, parseInt(e.target.value) || 0)} style={{ width: 100, textAlign: "right" }} />
                      <input value={p.note ?? ""} onChange={(e) => updPlan(p.id, { note: e.target.value })} placeholder="備考" style={{ width: 160 }} />
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

      <Panel title="ポイント設定">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Field label="呼び方"><input value={s.pointLabel} onChange={(e) => up("pointLabel", e.target.value)} /></Field>
          <Field label="単位"><input value={s.pointUnit} onChange={(e) => up("pointUnit", e.target.value)} /></Field>
        </div>
      </Panel>
    </VStack>
  );
}
