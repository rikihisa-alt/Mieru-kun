import Link from "next/link";
import { Coins, Trophy, History, ChevronRight, Activity, Calendar, CalendarPlus, Sparkles, Bell, Wallet } from "lucide-react";

export default function MyPage() {
  const c = { name: "田中 太郎", nickname: "タロウ", rank: "ゴールド", chips: 5000, points: 1200, visits: 25 };
  const displayName = c.nickname || c.name;

  return (
    <div className="ln-page">
      <div className="ln-stack">
        {/* プロフィール */}
        <div className="ln-card" style={{ textAlign: "center" }}>
          <div className="ln-avatar" style={{ marginBottom: 8 }}>{displayName.charAt(0)}</div>
          <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{displayName}</p>
          <div style={{ marginTop: 6 }}>
            <span className="ln-chip ln-chip--gold">{c.rank}</span>
          </div>
          <p className="ln-mute" style={{ fontSize: 11, marginTop: 6, marginBottom: 0 }}>来店 {c.visits}回</p>
        </div>

        {/* 残高 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div className="ln-card ln-card-compact">
            <div className="ln-row" style={{ marginBottom: 2 }}>
              <Coins size={12} className="ln-mute" />
              <span className="ln-mute" style={{ fontSize: 10 }}>チップ</span>
            </div>
            <p className="ln-num" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {c.chips.toLocaleString()}
              <span className="ln-mute" style={{ fontSize: 11, fontWeight: 400, marginLeft: 3 }}>枚</span>
            </p>
          </div>
          <div className="ln-card ln-card-compact">
            <div className="ln-row" style={{ marginBottom: 2 }}>
              <Trophy size={12} className="ln-mute" />
              <span className="ln-mute" style={{ fontSize: 10 }}>ポイント</span>
            </div>
            <p className="ln-num" style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>
              {c.points.toLocaleString()}
              <span className="ln-mute" style={{ fontSize: 11, fontWeight: 400, marginLeft: 3 }}>pt</span>
            </p>
          </div>
        </div>

        {/* メニュー */}
        <div className="ln-menu">
          <MenuLink href="/u3j5ny/p2x7nq" icon={<Bell size={16} />} label="注文・店員呼び出し" />
          <MenuLink href="/u3j5ny/y4r9vt" icon={<Activity size={16} />} label="店内状況" />
          <MenuLink href="/u3j5ny/k3f8qm" icon={<CalendarPlus size={16} />} label="来店予約" />
          <MenuLink href="/u3j5ny/d7s3xl" icon={<Calendar size={16} />} label="スケジュール" />
          <MenuLink href="/u3j5ny/c6h2zp" icon={<Trophy size={16} />} label="ランキング" />
          <MenuLink href="/u3j5ny/b3k9wf" icon={<Wallet size={16} />} label="保有残高" />
          <MenuLink href="/u3j5ny/h4n6pw" icon={<Coins size={16} />} label="チップ残高" />
          <MenuLink href="/u3j5ny/q2s9xf" icon={<Trophy size={16} />} label="ポイント" />
          <MenuLink href="/u3j5ny/m7k3rb" icon={<Sparkles size={16} />} label="マルチケ" />
          <MenuLink href="/u3j5ny/v5f8wz" icon={<History size={16} />} label="来店履歴" />
        </div>
      </div>
    </div>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="ln-menu__item">
      <span className="ln-menu__icon">{icon}</span>
      <span className="ln-menu__label">{label}</span>
      <ChevronRight size={16} className="ln-menu__chevron" />
    </Link>
  );
}
