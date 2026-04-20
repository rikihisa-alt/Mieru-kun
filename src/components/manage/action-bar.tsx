"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Plus, Grid3X3, Coins, CreditCard, X, ChevronUp } from "lucide-react";

export function ActionBar() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // ルート変更時は自動で閉じる
  useEffect(() => { setOpen(false); }, [pathname]);

  const actions = [
    { icon: <Plus />, label: "入店", color: "#3a8f7c", onClick: () => router.push("/floor") },
    { icon: <Grid3X3 />, label: "卓配置", color: "#16a34a", onClick: () => router.push("/tables") },
    { icon: <Coins />, label: "チップ", color: "#d97706", onClick: () => router.push("/customers") },
    { icon: <CreditCard />, label: "精算", color: "#7c3aed", onClick: () => router.push("/orders") },
  ];

  return (
    <>
      {/* 展開時の背景オーバーレイ（外クリックで閉じる） */}
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}

      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-2">
        {open && (
          <div className="flex flex-col gap-1.5 mb-1">
            {actions.map((a, i) => (
              <button
                key={i}
                onClick={() => { a.onClick(); setOpen(false); }}
                className="flex items-center gap-2.5 pl-4 pr-5 py-2.5 bg-white border border-[#d8d3cc] rounded-[8px] shadow-lg hover:shadow-xl transition-all text-[13px] font-medium text-[#2c3e50]"
              >
                <span className="w-7 h-7 rounded-[6px] flex items-center justify-center text-white [&>svg]:w-3.5 [&>svg]:h-3.5" style={{ backgroundColor: a.color }}>
                  {a.icon}
                </span>
                {a.label}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className={`w-12 h-12 rounded-[12px] flex items-center justify-center shadow-lg transition-all [&>svg]:w-5 [&>svg]:h-5 ${
            open ? "bg-[#2c3e50] text-white" : "bg-[#3a8f7c] text-white hover:bg-[#2f7a69]"
          }`}
        >
          {open ? <X /> : <ChevronUp />}
        </button>
      </div>
    </>
  );
}
