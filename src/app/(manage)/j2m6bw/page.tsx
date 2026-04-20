"use client";

import { useState } from "react";
import { Plus, Upload, Eye, EyeOff, Trash2, Image as ImageIcon } from "lucide-react";

interface Pop {
  id: string;
  title: string;
  imageUrl: string;
  isPublic: boolean;
  linkedEvent?: string;
}

const INIT: Pop[] = [
  { id: "p1", title: "春の感謝祭", imageUrl: "/illustrations/before-chip.png", isPublic: true, linkedEvent: "春のVIPナイト" },
  { id: "p2", title: "ウィークエンドトーナメント", imageUrl: "/illustrations/after-chip.png", isPublic: true, linkedEvent: "ホールデム・ウィークエンドトーナメント" },
  { id: "p3", title: "新作メニュー", imageUrl: "/illustrations/before-table.png", isPublic: false },
];

export default function PopManagePage() {
  const [pops, setPops] = useState<Pop[]>(INIT);

  function togglePublic(id: string) {
    setPops((p) => p.map((x) => (x.id === id ? { ...x, isPublic: !x.isPublic } : x)));
  }
  function remove(id: string) {
    if (!window.confirm("削除しますか？")) return;
    setPops((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#5a6977]">{pops.length} 件のPOP</p>
        <div className="flex gap-2">
          <button className="flex items-center gap-1 px-3 py-[7px] border border-[#d8d3cc] text-[#5a6977] text-[13px] font-medium rounded-[6px] hover:bg-[#f3f0ec]">
            <Upload className="w-3.5 h-3.5" />画像アップロード
          </button>
          <button className="flex items-center gap-1 px-3 py-[7px] bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69]">
            <Plus className="w-3.5 h-3.5" />POP作成
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {pops.map((p) => (
          <div key={p.id} className="border border-[#e8e4df] rounded-[8px] overflow-hidden bg-white">
            <div className="aspect-square bg-[#f3f0ec] flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-[#d8d3cc]" />
            </div>
            <div className="p-3 space-y-1">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-[13px] font-semibold text-[#2c3e50]">{p.title}</h4>
                  {p.linkedEvent && <p className="text-[11px] text-[#8e9baa]">→ {p.linkedEvent}</p>}
                </div>
                <button onClick={() => togglePublic(p.id)} className="p-1 hover:bg-[#f3f0ec] rounded">
                  {p.isPublic ? <Eye className="w-3.5 h-3.5 text-[#3a8f7c]" /> : <EyeOff className="w-3.5 h-3.5 text-[#8e9baa]" />}
                </button>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-[3px] ${p.isPublic ? "bg-[#e8f5f0] text-[#2e7d5b]" : "bg-[#f3f0ec] text-[#8e9baa]"}`}>
                  {p.isPublic ? "公開中" : "非公開"}
                </span>
                <button onClick={() => remove(p.id)} className="text-[#c5221f] p-1 hover:bg-[#fce8e6] rounded">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
