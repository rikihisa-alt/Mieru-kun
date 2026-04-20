"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, Coins, CreditCard, User } from "lucide-react";

type Rank = "regular" | "silver" | "gold" | "vip";

const RANK_COLORS: Record<string, string> = {
  vip: "#7c3aed",
  gold: "#d97706",
  silver: "#6b7280",
  regular: "#9ca3af",
};
const RANK_LABELS: Record<string, string> = {
  vip: "VIP",
  gold: "Gold",
  silver: "Silver",
  regular: "",
};

export interface ActionMenuCustomer {
  id: string;
  name: string; // 表示名（ニックネーム優先）
  realName?: string; // ニックネームがある場合の本名（補助表示）
  rank?: string;
  chips?: number;
  extra?: React.ReactNode; // 任意の追加情報/ボタン（例: 卓から外す）
}

interface Props {
  customer: ActionMenuCustomer;
  x: number;
  y: number;
  onClose: () => void;
}

export function CustomerActionMenu({ customer, x, y, onClose }: Props) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let left = x - rect.width / 2;
    let top = y - rect.height - 8;
    if (left < 8) left = 8;
    if (left + rect.width > window.innerWidth - 8) left = window.innerWidth - rect.width - 8;
    if (top < 8) top = y + 40;
    setPos({ left, top });
  }, [x, y]);

  const rank = customer.rank ?? "regular";
  const bgColor = RANK_COLORS[rank] ?? RANK_COLORS.regular;
  const label = RANK_LABELS[rank];

  function go(path: string) {
    router.push(path);
    onClose();
  }

  return (
    <>
      {/* 背景: サイドバー(z-50)より下、通常コンテンツより上 */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        ref={ref}
        className="fixed z-[60] bg-white border border-[#d8d3cc] rounded-[8px] shadow-lg p-3 min-w-[220px]"
        style={{ left: pos.left, top: pos.top }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#f3f0ec]">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
            style={{ backgroundColor: bgColor }}
          >
            {customer.name.charAt(0)}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-[#2c3e50]">{customer.name}</div>
            {customer.realName && <div className="text-[10px] text-[#8e9baa]">{customer.realName}</div>}
            {!customer.realName && label && <div className="text-[10px] text-[#8e9baa]">{label}</div>}
          </div>
          <button onClick={onClose} className="ml-auto p-0.5 hover:bg-[#f3f0ec] rounded-[4px]">
            <X className="w-3.5 h-3.5 text-[#8e9baa]" />
          </button>
        </div>

        {typeof customer.chips === "number" && (
          <div className="text-[12px] text-[#5a6977] mb-2">
            チップ: <strong className="text-[#2c3e50]">{customer.chips.toLocaleString()}枚</strong>
          </div>
        )}

        <div className="space-y-1">
          <button
            onClick={() => go(`/x6j2fp?customer=${encodeURIComponent(customer.id)}`)}
            className="w-full flex items-center gap-2 px-2 py-2 text-[12px] text-[#2c3e50] hover:bg-[#f3f0ec] rounded-[6px] transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#3a8f7c]" />
            注文登録
          </button>
          <button
            onClick={() => go(`/a9k5dm/${customer.id}?tab=ring`)}
            className="w-full flex items-center gap-2 px-2 py-2 text-[12px] text-[#2c3e50] hover:bg-[#f3f0ec] rounded-[6px] transition-colors"
          >
            <Coins className="w-3.5 h-3.5 text-[#d97706]" />
            チップ購入・付与登録
          </button>
          <button
            onClick={() => go(`/x6j2fp?settle=${encodeURIComponent(customer.id)}`)}
            className="w-full flex items-center gap-2 px-2 py-2 text-[12px] text-[#2c3e50] hover:bg-[#f3f0ec] rounded-[6px] transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5 text-[#7c3aed]" />
            清算登録
          </button>
          <button
            onClick={() => go(`/a9k5dm/${customer.id}`)}
            className="w-full flex items-center gap-2 px-2 py-2 text-[12px] text-[#5a6977] hover:bg-[#f3f0ec] rounded-[6px] transition-colors"
          >
            <User className="w-3.5 h-3.5 text-[#8e9baa]" />
            顧客詳細を開く
          </button>
        </div>

        {customer.extra && <div className="mt-3 pt-2 border-t border-[#f3f0ec]">{customer.extra}</div>}
      </div>
    </>
  );
}
