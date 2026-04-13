"use client";

import Link from "next/link";
import Image from "next/image";
import { LayoutGrid, Users, ShoppingBag, Clock, Coins, BarChart3, ArrowRight } from "lucide-react";

export default function Home() {
  function handleDemo() {
    document.cookie = "demo_mode=true; path=/; max-age=86400; SameSite=Lax";
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#e8e4df]">
        <div className="w-full px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="みえるくん" width={30} height={30} />
            <span className="text-[15px] font-bold text-[#2c3e50] tracking-tight">てんぽみえるくん</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-[7px] text-[13px] font-medium text-[#5f6368] hover:text-[#2c3e50] transition-colors">
              ログイン
            </Link>
            <button onClick={handleDemo} className="px-4 py-[7px] text-[13px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69] transition-colors">
              デモを見る
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-[#faf8f5] overflow-hidden">
        {/* 背景装飾 - パステル */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3a8f7c]/5 rounded-full blur-[100px] translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#e8c170]/8 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4" />
        </div>

        <div className="relative w-full px-8 md:px-16 py-20 md:py-28">
          <div className="max-w-3xl">
            <Image src="/logo-full.png" alt="てんぽみえるくん" width={300} height={75} className="mb-8" />
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#3a8f7c]/10 border border-[#3a8f7c]/20 rounded-full mb-6">
              <div className="w-1.5 h-1.5 bg-[#3a8f7c] rounded-full animate-pulse" />
              <span className="text-[12px] font-medium text-[#3a8f7c]">アミューズメントカジノ向け店舗管理</span>
            </div>
            <h1 className="text-[32px] md:text-[42px] font-bold text-[#2c3e50] leading-[1.2] mb-5 tracking-tight">
              店舗の運営を、
              <br />
              <span className="text-[#3a8f7c]">ひとつの画面</span>で。
            </h1>
            <p className="text-[16px] text-[#6b7280] leading-relaxed mb-10 max-w-xl">
              入退店・卓管理・注文精算・勤怠・顧客管理。
              <br />
              現場のオペレーションをシンプルに統合します。
            </p>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleDemo} className="group flex items-center gap-2 px-6 py-3 text-[14px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69] transition-all shadow-sm">
                デモを見る
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <Link href="/my" className="px-6 py-3 text-[14px] font-medium border border-[#d1ccc5] text-[#5f6368] rounded-[6px] hover:bg-white hover:border-[#b8b3ab] transition-all">
                顧客マイページ
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="bg-white py-20 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-12">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Features</p>
            <h2 className="text-[22px] font-bold text-[#2c3e50]">主な機能</h2>
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
      <section className="bg-[#faf8f5] py-16 border-t border-[#e8e4df]">
        <div className="text-center">
          <Image src="/logo-icon.png" alt="みえるくん" width={48} height={48} className="mx-auto mb-4" />
          <h3 className="text-[18px] font-bold text-[#2c3e50] mb-3">今すぐ体験してみましょう</h3>
          <p className="text-[14px] text-[#6b7280] mb-6">デモモードで全機能を操作できます</p>
          <button onClick={handleDemo} className="group inline-flex items-center gap-2 px-8 py-3 text-[14px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69] transition-all shadow-sm">
            デモを見る
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#e8e4df] py-8">
        <div className="flex items-center justify-center gap-2">
          <Image src="/logo-icon.png" alt="みえるくん" width={20} height={20} />
          <p className="text-[11px] text-[#9aa0a6]">&copy; {new Date().getFullYear()} てんぽみえるくん</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="group bg-[#faf8f5] border border-[#e8e4df] rounded-[8px] p-5 hover:border-[#3a8f7c]/30 hover:bg-[#f0f9f6] transition-all cursor-default">
      <div className="text-[#3a8f7c] mb-3 [&>svg]:w-5 [&>svg]:h-5">{icon}</div>
      <h3 className="text-[14px] font-semibold text-[#2c3e50] mb-1">{title}</h3>
      <p className="text-[12px] text-[#6b7280] leading-relaxed">{desc}</p>
    </div>
  );
}
