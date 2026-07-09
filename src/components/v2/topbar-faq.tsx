"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import { Modal } from "@/components/v2/ui";

const STEPS: { label: string; desc: string }[] = [
  { label: "① 入店", desc: "お客様の来店を記録し、卓へ案内します。" },
  { label: "② 卓", desc: "卓の空き状況を確認し、着席・移動・退席を管理します。" },
  { label: "③ 注文・精算", desc: "ドリンクやフード、チップなどの注文を記録し、会計を行います。" },
  { label: "④ 精算", desc: "現金・カード・後払いなど支払い方法を選び、会計を確定します。" },
  { label: "⑤ 締め", desc: "1日の売上・在庫・チップの動きを締めて集計します。" },
];

export function TopbarFaq() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="v2-icon-btn"
        aria-label="FAQ・ヘルプ"
        title="FAQ"
        onClick={() => setOpen(true)}
      >
        <HelpCircle size={17} />
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="使い方ガイド">
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 13, color: "var(--v2-text-sub)", marginBottom: 4 }}>
            基本の流れ: 入店 → 卓 → 注文 → 精算 → 締め
          </div>
          {STEPS.map((s) => (
            <div key={s.label} style={{ display: "flex", gap: 10, fontSize: 13 }}>
              <div style={{ fontWeight: 600, color: "var(--v2-text)", flexShrink: 0, width: 92 }}>{s.label}</div>
              <div style={{ color: "var(--v2-text-sub)" }}>{s.desc}</div>
            </div>
          ))}
          <div
            style={{
              marginTop: 8,
              padding: "10px 12px",
              borderRadius: "var(--v2-radius-sm)",
              background: "var(--v2-bg-alt)",
              fontSize: 12,
              color: "var(--v2-text-mute)",
              lineHeight: 1.6,
            }}
          >
            データはこの端末のブラウザに保存されています。他の端末とは自動で同期されません。
          </div>
        </div>
      </Modal>
    </>
  );
}
