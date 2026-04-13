"use client";

import Link from "next/link";
import { LayoutGrid, Users, ShoppingBag, Clock, Coins, BarChart3, ArrowRight } from "lucide-react";

export default function Home() {
  function handleDemo() {
    document.cookie = "demo_mode=true; path=/; max-age=86400; SameSite=Lax";
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0f1923]/95 backdrop-blur-sm border-b border-white/10">
        <div className="w-full px-8 h-14 flex items-center justify-between">
          <span className="text-[15px] font-bold text-white tracking-tight">てんぽみえるくん</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-[7px] text-[13px] font-medium text-white/70 hover:text-white transition-colors">
              ログイン
            </Link>
            <button onClick={handleDemo} className="px-4 py-[7px] text-[13px] font-medium bg-[#1a73e8] text-white rounded-[6px] hover:bg-[#1557b0] transition-colors">
              デモを見る
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-[#0f1923] text-white overflow-hidden">
        {/* 背景装飾 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#1a73e8]/8 rounded-full blur-[120px] translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#16a34a]/6 rounded-full blur-[100px] -translate-x-1/3 translate-y-1/4" />
          {/* グリッドパターン */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px"
          }} />
        </div>

        <div className="relative w-full px-8 md:px-16 py-24 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a73e8]/15 border border-[#1a73e8]/30 rounded-full mb-6">
              <div className="w-1.5 h-1.5 bg-[#1a73e8] rounded-full animate-pulse" />
              <span className="text-[12px] font-medium text-[#1a73e8]">アミューズメントカジノ向け店舗管理</span>
            </div>
            <h1 className="text-[32px] md:text-[44px] font-bold leading-[1.2] mb-5 tracking-tight">
              店舗の運営を、
              <br />
              <span className="text-[#1a73e8]">ひとつの画面</span>で。
            </h1>
            <p className="text-[16px] text-white/60 leading-relaxed mb-10 max-w-xl">
              入退店・卓管理・注文精算・勤怠・顧客管理。
              <br />
              現場のオペレーションをシンプルに統合します。
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleDemo} className="group flex items-center gap-2 px-6 py-3 text-[14px] font-medium bg-[#1a73e8] text-white rounded-[6px] hover:bg-[#1557b0] transition-all">
                デモを見る
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <Link href="/my" className="px-6 py-3 text-[14px] font-medium border border-white/20 text-white/80 rounded-[6px] hover:bg-white/5 hover:border-white/30 transition-all">
                顧客マイページ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="bg-white py-20">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-12">
            <p className="text-[12px] font-medium text-[#1a73e8] mb-2 uppercase tracking-wider">Features</p>
            <h2 className="text-[22px] font-bold text-[#1a1a1a]">主な機能</h2>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            <FeatureCard icon={<LayoutGrid />} title="卓管理" desc="トナメ・リング・サイドの配置" />
            <FeatureCard icon={<Users />} title="入退店" desc="来店から精算までの管理" />
            <FeatureCard icon={<ShoppingBag />} title="注文精算" desc="注文〜支払の一連フロー" />
            <FeatureCard icon={<Clock />} title="勤怠" desc="出退勤・シフト管理" />
            <FeatureCard icon={<Coins />} title="チップ管理" desc="付与・残高・履歴管理" />
            <FeatureCard icon={<BarChart3 />} title="経営分析" desc="売上・KPI・レポート" />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#f5f6f8] py-16 border-t border-[#dadce0]">
        <div className="text-center">
          <h3 className="text-[18px] font-bold text-[#1a1a1a] mb-3">今すぐ体験してみましょう</h3>
          <p className="text-[14px] text-[#5f6368] mb-6">デモモードで全機能を操作できます</p>
          <button onClick={handleDemo} className="group inline-flex items-center gap-2 px-8 py-3 text-[14px] font-medium bg-[#1a73e8] text-white rounded-[6px] hover:bg-[#1557b0] transition-all">
            デモを見る
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f1923] py-8">
        <p className="text-center text-[11px] text-white/30">&copy; {new Date().getFullYear()} てんぽみえるくん</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group border border-[#dadce0] rounded-[8px] p-5 hover:border-[#1a73e8]/30 hover:bg-[#f0f6ff] transition-all cursor-default">
      <div className="text-[#1a73e8] mb-3 [&>svg]:w-5 [&>svg]:h-5">{icon}</div>
      <h3 className="text-[14px] font-semibold text-[#1a1a1a] mb-1">{title}</h3>
      <p className="text-[12px] text-[#5f6368] leading-relaxed">{desc}</p>
    </div>
  );
}
