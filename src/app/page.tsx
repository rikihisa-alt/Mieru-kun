"use client";

import Link from "next/link";
import Image from "next/image";
import {
  LayoutGrid, Users, ShoppingBag, Clock, Coins, BarChart3, ArrowRight,
  DoorOpen, Grid3X3, CreditCard, ClipboardCheck, ChevronRight,
} from "lucide-react";

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
            <Link href="/login" className="px-3 py-[7px] text-[13px] font-medium text-[#5a6977] hover:text-[#2c3e50] transition-colors">
              ログイン
            </Link>
            <button onClick={handleDemo} className="px-4 py-[7px] text-[13px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69] transition-colors">
              デモを見る
            </button>
          </div>
        </div>
      </header>

      {/* Hero - 2カラム */}
      <section className="relative bg-[#faf8f5] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3a8f7c]/5 rounded-full blur-[100px] translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#e8c170]/8 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4" />
        </div>

        <div className="relative w-full px-8 md:px-16 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-12 items-start">
            {/* 左: メインコピー */}
            <div className="w-full lg:w-[42%] lg:pl-8">
              <Image src="/logo-full.png" alt="てんぽみえるくん" width={280} height={70} className="mb-6" />
              <p className="text-[12px] font-medium text-[#3a8f7c] mb-4 tracking-wide">アミューズメントカジノ向け店舗管理</p>
              <h1 className="text-[30px] md:text-[40px] font-bold text-[#2c3e50] leading-[1.2] mb-4 tracking-tight">
                店舗の運営を、
                <br />
                <span className="text-[#3a8f7c]">ひとつの画面</span>で。
              </h1>
              <p className="text-[15px] text-[#6b7280] leading-relaxed mb-8">
                入退店・卓管理・注文精算・勤怠・顧客管理。
                <br />
                現場のオペレーションをシンプルに統合します。
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={handleDemo} className="group flex items-center gap-2 px-6 py-3 text-[14px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69] transition-all shadow-sm">
                  デモを見る
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <Link href="/my" className="px-6 py-3 text-[14px] font-medium border border-[#d1ccc5] text-[#5a6977] rounded-[6px] hover:bg-white hover:border-[#b8b3ab] transition-all">
                  顧客マイページ
                </Link>
              </div>
            </div>

            {/* 右: 運営フロー紹介（横長） */}
            <div className="w-full lg:w-[58%]">
              <div className="bg-white border border-[#e8e4df] rounded-[12px] p-6 shadow-sm">
                <p className="text-[11px] font-semibold text-[#3a8f7c] uppercase tracking-wider mb-4">Operation Flow</p>
                <h3 className="text-[16px] font-bold text-[#2c3e50] mb-5">店舗運営の一連の流れ</h3>
                <div className="space-y-0">
                  <FlowStep num={1} icon={<DoorOpen />} title="入店登録" desc="来店顧客を登録。VIP・常連を自動識別" active />
                  <FlowConnector />
                  <FlowStep num={2} icon={<Grid3X3 />} title="卓に配置" desc="ドラッグ&ドロップでテーブルに配置" />
                  <FlowConnector />
                  <FlowStep num={3} icon={<ShoppingBag />} title="注文受付" desc="ドリンク・フード・チップをワンタップ注文" />
                  <FlowConnector />
                  <FlowStep num={4} icon={<CreditCard />} title="精算" desc="現金・カード・電子マネーで精算処理" />
                  <FlowConnector />
                  <FlowStep num={5} icon={<ClipboardCheck />} title="締め処理" desc="日次の売上を確定。レジ差異も管理" last />
                </div>
                <button onClick={handleDemo} className="mt-5 w-full flex items-center justify-center gap-1.5 py-2.5 bg-[#faf8f5] border border-[#e8e4df] text-[13px] font-medium text-[#3a8f7c] rounded-[6px] hover:bg-[#f0f9f6] transition-colors">
                  このフローを体験する
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
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

      <footer className="bg-white border-t border-[#e8e4df] py-8">
        <div className="flex items-center justify-center gap-2">
          <Image src="/logo-icon.png" alt="みえるくん" width={20} height={20} />
          <p className="text-[11px] text-[#8e9baa]">&copy; {new Date().getFullYear()} てんぽみえるくん</p>
        </div>
      </footer>
    </div>
  );
}

// --- フローステップ ---
function FlowStep({ num, icon, title, desc, active, last }: {
  num: number; icon: React.ReactNode; title: string; desc: string; active?: boolean; last?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-[8px] transition-colors ${active ? "bg-[#f0f9f6] border border-[#3a8f7c]/15" : ""}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold ${
        active ? "bg-[#3a8f7c] text-white" : "bg-[#e8e4df] text-[#5a6977]"
      }`}>
        {num}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`[&>svg]:w-3.5 [&>svg]:h-3.5 ${active ? "text-[#3a8f7c]" : "text-[#8e9baa]"}`}>{icon}</span>
          <span className={`text-[13px] font-semibold ${active ? "text-[#2c3e50]" : "text-[#5a6977]"}`}>{title}</span>
        </div>
        <p className="text-[11px] text-[#8e9baa] leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function FlowConnector() {
  return (
    <div className="flex items-center pl-6 py-0.5">
      <div className="w-px h-4 bg-[#d8d3cc]" />
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
