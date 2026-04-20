import Link from "next/link";
import { Coins, Trophy, History, ChevronRight, Activity, Calendar, CalendarPlus } from "lucide-react";

export default function MyPage() {
  const c = { name: "田中 太郎", nickname: "タロウ", rank: "ゴールド", chips: 5000, points: 1200, visits: 25 };
  const displayName = c.nickname || c.name;

  return (
    <div className="space-y-3">
      {/* プロフィール */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] p-4 text-center">
        <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center mx-auto mb-2">
          <span className="text-[18px] font-bold text-accent">{displayName.charAt(0)}</span>
        </div>
        <p className="text-[15px] font-bold">{displayName}</p>
        {c.nickname && <p className="text-[11px] text-text-tertiary">{c.name}</p>}
        <span className="inline-block mt-1 px-2 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)] bg-status-warning-bg text-status-warning">
          {c.rank}
        </span>
        <p className="text-[11px] text-text-tertiary mt-1">来店 {c.visits}回</p>
      </div>

      {/* 残高 */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-bg-white border border-border rounded-[var(--radius)] px-3 py-2.5">
          <div className="flex items-center gap-1 mb-0.5">
            <Coins className="w-3 h-3 text-text-tertiary" />
            <span className="text-[10px] text-text-tertiary">チップ</span>
          </div>
          <p className="text-[18px] font-bold">{c.chips.toLocaleString()}<span className="text-[11px] font-normal text-text-tertiary ml-0.5">枚</span></p>
        </div>
        <div className="bg-bg-white border border-border rounded-[var(--radius)] px-3 py-2.5">
          <div className="flex items-center gap-1 mb-0.5">
            <Trophy className="w-3 h-3 text-text-tertiary" />
            <span className="text-[10px] text-text-tertiary">ポイント</span>
          </div>
          <p className="text-[18px] font-bold">{c.points.toLocaleString()}<span className="text-[11px] font-normal text-text-tertiary ml-0.5">pt</span></p>
        </div>
      </div>

      {/* メニュー */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] divide-y divide-border-light">
        <MenuLink href="/u3j5ny/y4r9vt" icon={<Activity />} label="店内状況" />
        <MenuLink href="/u3j5ny/k3f8qm" icon={<CalendarPlus />} label="来店予約" />
        <MenuLink href="/u3j5ny/d7s3xl" icon={<Calendar />} label="イベント" />
        <MenuLink href="/u3j5ny/c6h2zp" icon={<Trophy />} label="ランキング" />
        <MenuLink href="/u3j5ny/b3k9wf" icon={<Coins />} label="保有残高（リング/サイド/マルチケ）" />
        <MenuLink href="/u3j5ny/visit" icon={<History />} label="来店履歴" />
        <MenuLink href="/u3j5ny/chips" icon={<Coins />} label="チップ・ポイント詳細" />
      </div>
    </div>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center justify-between px-4 py-3 hover:bg-bg-hover transition-colors">
      <div className="flex items-center gap-2.5">
        <span className="text-text-tertiary [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-text-tertiary" />
    </Link>
  );
}
