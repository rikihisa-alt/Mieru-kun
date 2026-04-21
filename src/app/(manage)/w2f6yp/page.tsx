"use client";

import { useState } from "react";
import { executeClosingAction } from "@/lib/actions/closing-actions";
import { formatCurrency, todayString } from "@/lib/utils";
import { Lock, CheckCircle, AlertTriangle } from "lucide-react";

export default function ClosingPage() {
  const [date, setDate] = useState(todayString());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);

  // サマリ（デモ用の初期値）
  const summary = {
    total_sales: 0,
    total_visitors: 0,
    total_orders: 0,
    cash_amount: 0,
    card_amount: 0,
    electronic_amount: 0,
  };

  async function handleSubmit() {
    setLoading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.set("date", date);
      fd.set("notes", notes);
      const res = await executeClosingAction(fd);
      setResult(res);
    } catch {
      setResult({ error: "締め処理に失敗しました" });
    } finally {
      setLoading(false);
    }
  }

  if (result?.success) {
    return (
      <div className="page-stack">
        <div className="glass-panel max-w-xl mx-auto text-center p-12">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-[color:var(--success-text)]" />
          <h2 className="t-md mb-1">締め処理が完了しました</h2>
          <p className="text-[14px] text-text-secondary mb-6">{date} の締め処理が正常に実行されました。</p>
          <button
            onClick={() => { setResult(null); setNotes(""); }}
            className="btn btn-subtle"
          >
            別の日付で締め処理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      {/* KPI横一列 */}
      <section>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div className="flex items-end gap-8 flex-wrap">
            <KpiItem label="対象日" value={date} />
            <KpiItem label="売上" value={formatCurrency(summary.total_sales)} />
            <KpiItem label="来店" value={summary.total_visitors} unit="人" />
            <KpiItem label="注文" value={summary.total_orders} unit="件" />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary"
          >
            <Lock className="w-3.5 h-3.5" />
            {loading ? "処理中..." : "締め処理を実行"}
          </button>
        </div>
      </section>

      {/* 締め対象日 */}
      <section className="glass-panel">
        <label className="block t-label mb-3">締め対象日</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-xs"
        />
      </section>

      {/* 売上サマリ */}
      <section className="glass-panel">
        <p className="t-label mb-4">売上サマリ</p>
        <div className="grid grid-cols-3 gap-6 pb-5 border-b border-border-light">
          <SummaryStat label="売上合計" value={formatCurrency(summary.total_sales)} />
          <SummaryStat label="来店数" value={`${summary.total_visitors}人`} />
          <SummaryStat label="注文数" value={`${summary.total_orders}件`} />
        </div>
        <div className="pt-5">
          <p className="t-label mb-3">支払方法内訳</p>
          <div className="space-y-2">
            <PaymentRow label="現金" value={formatCurrency(summary.cash_amount)} />
            <PaymentRow label="カード" value={formatCurrency(summary.card_amount)} />
            <PaymentRow label="電子マネー" value={formatCurrency(summary.electronic_amount)} />
          </div>
        </div>
      </section>

      {/* 備考 */}
      <section className="glass-panel">
        <label className="block t-label mb-3">備考</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="締め処理に関するメモを入力..."
        />
      </section>

      {/* エラー */}
      {result?.error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-[var(--radius)] text-[14px]"
          style={{ background: "var(--danger-soft-bg)", color: "var(--danger-text)", border: "1px solid rgba(220,60,60,0.20)" }}>
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{result.error}</span>
        </div>
      )}
    </div>
  );
}

function KpiItem({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex flex-col items-start gap-1">
      <span className="t-label">{label}</span>
      <span className="flex items-baseline gap-1">
        <span className="t-value">{value}</span>
        {unit && <span className="text-[14px] text-text-tertiary">{unit}</span>}
      </span>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="block t-xs text-text-tertiary mb-1">{label}</span>
      <span className="text-[20px] font-bold text-text-primary tabular-nums">{value}</span>
    </div>
  );
}

function PaymentRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-[var(--radius-sm)] hover:bg-white/50 transition-colors">
      <span className="text-[14px] text-text-secondary">{label}</span>
      <span className="text-[14px] font-medium tabular-nums">{value}</span>
    </div>
  );
}
