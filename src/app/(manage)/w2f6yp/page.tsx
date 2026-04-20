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
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="p-8">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-status-success" />
          <h2 className="text-[16px] font-bold text-text-primary mb-1">締め処理が完了しました</h2>
          <p className="text-[13px] text-text-secondary mb-4">{date} の締め処理が正常に実行されました。</p>
          <button
            onClick={() => {
              setResult(null);
              setNotes("");
            }}
            className="px-3 py-[7px] text-[13px] font-medium text-accent hover:bg-accent-light rounded-[6px] transition-colors"
          >
            別の日付で締め処理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1.5">
          <span className="text-text-tertiary text-[13px]">対象日</span>
          <span className="text-[15px] font-bold text-text-primary">{date}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-text-tertiary text-[13px]">売上</span>
          <span className="text-[15px] font-bold text-text-primary">{formatCurrency(summary.total_sales)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-text-tertiary text-[13px]">来店</span>
          <span className="text-[15px] font-bold text-text-primary">{summary.total_visitors}人</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-text-tertiary text-[13px]">注文</span>
          <span className="text-[15px] font-bold text-text-primary">{summary.total_orders}件</span>
        </div>
      </div>

      {/* 日付入力 */}
      <div className="pb-4 border-b border-border-light">
        <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
          締め対象日
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="max-w-xs text-[13px]"
        />
      </div>

      {/* サマリカード */}
      <div className="pb-4 border-b border-border-light">
        <h2 className="text-[13px] font-semibold text-text-primary mb-3">売上サマリ</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <span className="block text-[11px] text-text-tertiary mb-0.5">売上合計</span>
            <span className="text-[18px] font-bold text-text-primary">{formatCurrency(summary.total_sales)}</span>
          </div>
          <div>
            <span className="block text-[11px] text-text-tertiary mb-0.5">来店数</span>
            <span className="text-[18px] font-bold text-text-primary">{summary.total_visitors}人</span>
          </div>
          <div>
            <span className="block text-[11px] text-text-tertiary mb-0.5">注文数</span>
            <span className="text-[18px] font-bold text-text-primary">{summary.total_orders}件</span>
          </div>
        </div>
        <div className="border-t border-border-light pt-3">
          <h3 className="text-[12px] font-medium text-text-secondary mb-2">支払方法内訳</h3>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-secondary">現金</span>
              <span className="font-medium">{formatCurrency(summary.cash_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-secondary">カード</span>
              <span className="font-medium">{formatCurrency(summary.card_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-text-secondary">電子マネー</span>
              <span className="font-medium">{formatCurrency(summary.electronic_amount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* メモ */}
      <div className="pb-4 border-b border-border-light">
        <label className="block text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2">
          備考
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="締め処理に関するメモを入力..."
          className="text-[13px]"
        />
      </div>

      {/* エラー表示 */}
      {result?.error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-status-danger-bg border border-[#c5221f]/20 rounded-[6px] text-[13px]">
          <AlertTriangle className="w-4 h-4 text-status-danger flex-shrink-0" />
          <span className="text-status-danger font-medium">{result.error}</span>
        </div>
      )}

      {/* 実行ボタン */}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex items-center gap-1.5 px-4 py-[7px] bg-accent text-white text-[13px] font-medium rounded-[6px] hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        <Lock className="w-3.5 h-3.5" />
        {loading ? "処理中..." : "締め処理を実行"}
      </button>
    </div>
  );
}
