"use client";

import { useState } from "react";
import { Plus, Calendar, Users, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface EventItem {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  reservedCount: number;
  deadline: string;
  isPublic: boolean;
  coverImageUrl?: string;
}

const INIT: EventItem[] = [
  { id: "ev1", title: "春のVIPナイト", description: "VIP会員限定のスペシャルナイト", startsAt: "2026-04-25 20:00", endsAt: "2026-04-26 02:00", capacity: 30, reservedCount: 18, deadline: "2026-04-24 18:00", isPublic: true },
  { id: "ev2", title: "ホールデム・ウィークエンドトーナメント", description: "エントリー3,000円・プライズ合計50,000円", startsAt: "2026-04-27 19:00", endsAt: "2026-04-27 23:00", capacity: 40, reservedCount: 25, deadline: "2026-04-27 18:00", isPublic: true },
  { id: "ev3", title: "新作カクテル試飲会", description: "限定10名・要予約", startsAt: "2026-05-02 22:00", endsAt: "2026-05-02 23:00", capacity: 10, reservedCount: 3, deadline: "2026-05-01 20:00", isPublic: false },
];

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>(INIT);
  const [showForm, setShowForm] = useState(false);

  function togglePublic(id: string) {
    setEvents((p) => p.map((e) => (e.id === id ? { ...e, isPublic: !e.isPublic } : e)));
  }
  function deleteEvent(id: string) {
    if (!window.confirm("削除しますか？")) return;
    setEvents((p) => p.filter((e) => e.id !== id));
  }

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-[#5a6977]">{events.length} 件のイベント</p>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-1 px-3 py-[7px] bg-[#3a8f7c] text-white text-[13px] font-medium rounded-[6px] hover:bg-[#2f7a69]">
          <Plus className="w-3.5 h-3.5" />イベント追加
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-[#faf8f5] border border-[#e8e4df] rounded-[8px] space-y-3">
          <h3 className="text-[13px] font-semibold">新規イベント</h3>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="タイトル" className="text-[13px]" />
            <input type="number" placeholder="定員" className="text-[13px]" />
            <input type="datetime-local" className="text-[13px]" />
            <input type="datetime-local" className="text-[13px]" />
          </div>
          <textarea placeholder="説明" rows={2} className="text-[13px] resize-none" />
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-[#3a8f7c] text-white text-[12px] font-medium rounded-[6px]">保存</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-2 text-[12px] text-[#5a6977]">取消</button>
          </div>
        </div>
      )}

      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-[#e8e4df]">
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">タイトル</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">日時</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">受付締切</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">予約</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">公開</th>
            <th className="px-3 py-2 text-[11px] font-semibold text-[#8e9baa] uppercase tracking-wider text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => {
            const pct = e.capacity > 0 ? (e.reservedCount / e.capacity) * 100 : 0;
            return (
              <tr key={e.id} className="border-b border-[#f3f0ec] hover:bg-[#faf8f5]">
                <td className="px-3 py-2.5">
                  <div className="font-medium">{e.title}</div>
                  <div className="text-[11px] text-[#8e9baa] truncate max-w-[260px]">{e.description}</div>
                </td>
                <td className="px-3 py-2.5 text-[#5a6977] text-[12px]">
                  <Calendar className="w-3 h-3 inline mr-1 text-[#8e9baa]" />
                  {e.startsAt.slice(5)} 〜 {e.endsAt.slice(5)}
                </td>
                <td className="px-3 py-2.5 text-[#5a6977] text-[12px]">{e.deadline.slice(5)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-[#8e9baa]" />
                    <span className="font-medium">{e.reservedCount}/{e.capacity}</span>
                    <div className="flex-1 h-1 bg-[#f3f0ec] rounded-full overflow-hidden w-16">
                      <div className="h-full bg-[#3a8f7c]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <button onClick={() => togglePublic(e.id)} className="flex items-center gap-1 text-[11px] text-[#5a6977] hover:bg-[#f3f0ec] px-2 py-1 rounded-[4px]">
                    {e.isPublic ? <><Eye className="w-3 h-3 text-[#3a8f7c]" />公開中</> : <><EyeOff className="w-3 h-3" />非公開</>}
                  </button>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-[#f3f0ec] rounded text-[#5a6977]"><Pencil className="w-3 h-3" /></button>
                    <button onClick={() => deleteEvent(e.id)} className="p-1 hover:bg-[#fce8e6] rounded text-[#c5221f]"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
