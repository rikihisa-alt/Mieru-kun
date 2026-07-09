"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PageHeader, Panel, VStack, Empty, Btn } from "@/components/v2/ui";
import { useOrders, useOrderEvents, orderStore } from "@/lib/orders/store";
import { STATUS_LABEL, KIND_LABEL, CALL_REASON_LABEL, type OrderStatus } from "@/lib/orders/types";
import { Bell, BellOff } from "lucide-react";

const SOUND_PREF_KEY = "v2_live_sound_on";

/** Web Audio APIで短いビープ音を自前生成して鳴らす (外部音源ファイル不要) */
function playBeep() {
  try {
    type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };
    const w = window as WindowWithWebkitAudio;
    const Ctx = window.AudioContext || w.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio 非対応環境では無音でスキップ
  }
}

export default function LivePage() {
  const orders = useOrders();
  const active = orders.filter(o => o.status !== "done" && o.status !== "canceled");

  const [soundOn, setSoundOn] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem(SOUND_PREF_KEY);
      return saved !== null ? saved === "1" : true;
    } catch {
      return true;
    }
  });
  const [newCount, setNewCount] = useState(0);
  const soundOnRef = useRef(soundOn);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  function toggleSound() {
    setSoundOn(v => {
      const next = !v;
      try { localStorage.setItem(SOUND_PREF_KEY, next ? "1" : "0"); } catch { /* */ }
      return next;
    });
  }

  // 新着注文(呼び出し含む)を検知してバッジ+ビープ通知
  const handleEvent = useCallback((e: { type: "added" | "updated" | "sync" }) => {
    if (e.type !== "added") return;
    setNewCount(c => c + 1);
    if (soundOnRef.current) playBeep();
  }, []);
  useOrderEvents(handleEvent);

  // 一覧を見ている間にバッジを確認したらクリア
  function clearBadge() { setNewCount(0); }

  return (
    <VStack gap={16}>
      <PageHeader
        title={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            ライブ注文
            {newCount > 0 && (
              <span
                onClick={clearBadge}
                title="クリックで既読にする"
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  minWidth: 20, height: 20, padding: "0 6px", borderRadius: 999,
                  background: "var(--v2-danger)", color: "#fff",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  animation: "v2-blink 1.2s ease-in-out infinite",
                }}
              >
                +{newCount}
              </span>
            )}
          </span>
        }
        sub={`${active.length}件 未対応`}
        action={
          <Btn
            variant="ghost"
            size="sm"
            onClick={toggleSound}
            title={soundOn ? "通知音をOFFにする" : "通知音をONにする"}
          >
            {soundOn ? <Bell size={14} /> : <BellOff size={14} />}
            通知音 {soundOn ? "ON" : "OFF"}
          </Btn>
        }
      />
      <Panel>
        {active.length === 0 ? <Empty>ライブ注文はありません</Empty> : (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead><tr><th>時刻</th><th>卓・席</th><th>顧客</th><th>種別</th><th>内容</th><th>状態</th></tr></thead>
              <tbody>
                {active.map(o => (
                  <tr key={o.id}>
                    <td className="v2-num v2-sub">{new Date(o.createdAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}</td>
                    <td>{o.seat.tableNo} <span className="v2-mute">{o.seat.seatNo}</span></td>
                    <td>{o.customer.displayName}</td>
                    <td className="v2-mute">{KIND_LABEL[o.kind]}</td>
                    <td className="v2-sub" style={{ fontSize: 12 }}>
                      {o.kind === "call" ? (o.call ? CALL_REASON_LABEL[o.call.type] : "") : o.items?.map(i => `${i.name}×${i.qty}`).join(" / ")}
                    </td>
                    <td>
                      <select value={o.status} onChange={(e) => orderStore.updateStatus(o.id, e.target.value as OrderStatus)}>
                        <option value="new">{STATUS_LABEL.new}</option>
                        <option value="preparing">{STATUS_LABEL.preparing}</option>
                        <option value="served">{STATUS_LABEL.served}</option>
                        <option value="done">{STATUS_LABEL.done}</option>
                        <option value="canceled">{STATUS_LABEL.canceled}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {/* ※ 複数端末間のリアルタイム同期はDB化(Supabase Realtime等)まで対象外。現状はBroadcastChannel/localStorageのみ */}
    </VStack>
  );
}
