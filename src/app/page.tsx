"use client";

import Link from "next/link";

export default function Home() {
  function handleDemo() {
    document.cookie = "demo_mode=true; path=/; max-age=86400; SameSite=Lax";
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="bg-bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <span className="text-[15px] font-bold text-text-primary">てんぽみえるくん</span>
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-[7px] text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors">
              ログイン
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-6 py-20">
          <p className="text-[12px] font-medium text-accent mb-3">アミューズメントカジノ向け店舗管理</p>
          <h1 className="text-[28px] md:text-[36px] font-bold text-text-primary leading-tight mb-4">
            店舗の運営を、<br />ひとつの画面で。
          </h1>
          <p className="text-[15px] text-text-secondary leading-relaxed mb-8 max-w-lg">
            入退店・卓管理・注文精算・勤怠・顧客管理。<br />
            現場のオペレーションをシンプルに統合します。
          </p>
          <div className="flex gap-3">
            <button onClick={handleDemo} className="px-5 py-2.5 text-[14px] font-medium bg-accent text-white rounded-[var(--radius)] hover:bg-accent-hover transition-colors">
              デモを見る
            </button>
            <Link href="/my" className="px-5 py-2.5 text-[14px] font-medium border border-border text-text-secondary rounded-[var(--radius)] hover:bg-bg-hover transition-colors">
              顧客マイページ
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-bg-white py-16">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-[16px] font-bold text-text-primary mb-8">主な機能</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <Feature title="入店管理" desc="人数管理、エントランス料、未払確認をリアルタイムに" />
              <Feature title="卓管理" desc="トナメ・サイド・リングの卓配置とディーラー管理" />
              <Feature title="注文 / 精算" desc="注文から精算まで、一連の流れを1画面で完結" />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-6">
        <p className="text-center text-[11px] text-text-tertiary">&copy; {new Date().getFullYear()} てんぽみえるくん</p>
      </footer>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="border border-border rounded-[var(--radius-lg)] p-4">
      <h3 className="text-[14px] font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-[12px] text-text-secondary leading-relaxed">{desc}</p>
    </div>
  );
}
