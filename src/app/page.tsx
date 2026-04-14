"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight, ChevronRight, ChevronDown, Check, Minus,
  DoorOpen, Grid3X3, ShoppingBag, CreditCard, ClipboardCheck, Clock,
  Users, Coins, BarChart3, Shield, Smartphone, LineChart,
  Zap, TrendingDown, UserCheck, Building2, MessageCircle,
} from "lucide-react";

export default function Home() {
  function handleDemo() {
    document.cookie = "demo_mode=true; path=/; max-age=86400; SameSite=Lax";
    window.location.href = "/dashboard";
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-[#e8e4df]">
        <div className="w-full px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="みえるくん" width={30} height={30} />
            <span className="text-[15px] font-bold text-[#2c3e50] tracking-tight">てんぽみえるくん</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-[13px] text-[#5a6977]">
            <a href="#flow" className="hover:text-[#2c3e50] transition-colors">運営フロー</a>
            <a href="#features" className="hover:text-[#2c3e50] transition-colors">機能</a>
            <a href="#merit" className="hover:text-[#2c3e50] transition-colors">導入メリット</a>
            <a href="#pricing" className="hover:text-[#2c3e50] transition-colors">料金</a>
            <a href="#faq" className="hover:text-[#2c3e50] transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-3 py-[7px] text-[13px] font-medium text-[#5a6977] hover:text-[#2c3e50]">ログイン</Link>
            <button onClick={handleDemo} className="px-4 py-[7px] text-[13px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69]">デモを見る</button>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative bg-[#faf8f5] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#3a8f7c]/5 rounded-full blur-[100px] translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#e8c170]/8 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative w-full px-8 md:px-16 py-16 md:py-20">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
            <div className="w-full lg:w-[48%] lg:pl-4">
              <Image src="/logo-full.png" alt="てんぽみえるくん" width={280} height={70} className="mb-5" />
              <p className="text-[12px] font-medium text-[#3a8f7c] mb-3 tracking-wide">アミューズメントカジノ専用 店舗運営システム</p>
              <h1 className="text-[28px] md:text-[36px] font-bold text-[#2c3e50] leading-[1.25] mb-4 tracking-tight">
                入退店から精算、勤怠まで。<br />
                店舗運営を<span className="text-[#3a8f7c]">ひとつの画面</span>に。
              </h1>
              <p className="text-[14px] text-[#5a6977] leading-[1.8] mb-6">
                ポーカーテーブルへの配置、ドリンク注文、チップ管理、スタッフの勤怠やシフトまで。
                LINEとの連携で、スタッフも顧客もスマホから操作可能。
              </p>
              <div className="flex flex-wrap gap-3 mb-5">
                <button onClick={handleDemo} className="group flex items-center gap-2 px-6 py-2.5 text-[14px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69] shadow-sm">
                  無料でデモを体験<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <a href="#pricing" className="px-5 py-2.5 text-[14px] font-medium border border-[#d1ccc5] text-[#5a6977] rounded-[6px] hover:bg-white">料金を見る</a>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-[#8e9baa]">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#3a8f7c]" />初期費用0円</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#3a8f7c]" />最短即日導入</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#3a8f7c]" />LINE連携</span>
              </div>
            </div>
            {/* 右: ダッシュボードプレビュー */}
            <div className="w-full lg:w-[52%]">
              <div className="bg-white border border-[#e8e4df] rounded-[12px] overflow-hidden shadow-sm">
                <div className="h-7 bg-[#f3f0ec] border-b border-[#e8e4df] flex items-center px-3 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#d8d3cc]" /><div className="w-2 h-2 rounded-full bg-[#d8d3cc]" /><div className="w-2 h-2 rounded-full bg-[#d8d3cc]" />
                  <span className="text-[9px] text-[#8e9baa] ml-2">てんぽみえるくん — ダッシュボード</span>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3 text-[12px] pb-3 border-b border-[#f3f0ec]">
                    <span className="text-[#8e9baa]">来店 <strong className="text-[#2c3e50]">8名</strong></span>
                    <span className="text-[#8e9baa]">稼働 <strong className="text-[#2c3e50]">3/4</strong></span>
                    <span className="text-[#8e9baa]">出勤 <strong className="text-[#2c3e50]">4名</strong></span>
                    <span className="text-[#3a8f7c] font-medium">売上 ¥185,000</span>
                  </div>
                  {/* ミニ卓表示 */}
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {[{ n: "T1", o: 3, m: 9 }, { n: "T2", o: 1, m: 9 }, { n: "T3", o: 2, m: 10 }, { n: "T4", o: 0, m: 6 }].map((t, i) => (
                      <div key={i} className="text-center py-1.5 rounded-[4px]" style={{ backgroundColor: t.o > 0 ? "#e8f5f0" : "#f3f0ec" }}>
                        <p className="text-[10px] text-[#8e9baa]">{t.n}</p>
                        <p className={`text-[13px] font-bold ${t.o > 0 ? "text-[#2c3e50]" : "text-[#d8d3cc]"}`}>{t.o}/{t.m}</p>
                      </div>
                    ))}
                  </div>
                  {/* タイムライン */}
                  <div className="space-y-1 text-[11px]">
                    {[
                      { t: "21:00", type: "入店", n: "山本 翔太", c: "#3a8f7c" },
                      { t: "20:45", type: "注文", n: "田中 太郎", c: "#3a8f7c" },
                      { t: "20:00", type: "イベント", n: "VIPナイト", c: "#7c3aed" },
                      { t: "18:00", type: "出勤", n: "山田 太郎", c: "#2c3e50" },
                    ].map((ev, i) => (
                      <div key={i} className="flex items-center gap-2 py-0.5">
                        <span className="text-[#8e9baa] font-mono w-9 text-[10px]">{ev.t}</span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.c }} />
                        <span className="text-[9px] font-semibold uppercase" style={{ color: ev.c }}>{ev.type}</span>
                        <span className="text-[#2c3e50]">{ev.n}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 数字で見る効果 ===== */}
      <section className="bg-white py-12 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <Stat value="2〜3h" label="1日の業務削減時間" />
            <Stat value="0円" label="初期導入費用" />
            <Stat value="即日" label="最短導入期間" />
            <Stat value="99.9%" label="サービス稼働率" />
          </div>
        </div>
      </section>

      {/* ===== 課題 → 解決 ===== */}
      <section className="py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Before → After</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50]">こんな課題を、こう解決します</h2>
          </div>
          <div className="space-y-3">
            <ProblemSolution problem="入退店が手書き・Excelで状況把握が遅い" solution="リアルタイムのタイムラインで即座に把握" />
            <ProblemSolution problem="卓の空席やディーラー配置の確認に時間がかかる" solution="ビジュアル卓管理でドラッグ&ドロップ配置" />
            <ProblemSolution problem="チップ・ポイント管理が煩雑でミスが発生" solution="履歴ベースの残高管理で整合性を自動担保" />
            <ProblemSolution problem="シフト作成と勤怠管理が別ツールで非効率" solution="タイムラインUIでシフト作成、LINEで打刻" />
            <ProblemSolution problem="売上締めに時間がかかりレジ差異の追跡が困難" solution="ワンクリック締め処理、差異自動検知" />
          </div>
        </div>
      </section>

      {/* ===== 運営フロー ===== */}
      <section id="flow" className="bg-white py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Operation Flow</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50] mb-1">1日の運営がそのままシステムに</h2>
            <p className="text-[13px] text-[#5a6977]">開店から締めまで、業務の流れに沿って自然に操作できます</p>
          </div>
          <div className="flex items-start gap-2 overflow-x-auto pb-2">
            {[
              { num: 1, icon: <DoorOpen />, title: "入店登録", desc: "QRコード・LINEからの入店にも対応。VIP・常連は自動識別。" },
              { num: 2, icon: <Grid3X3 />, title: "卓に配置", desc: "ドラッグ&ドロップでテーブルに配置。ディーラーも管理。" },
              { num: 3, icon: <ShoppingBag />, title: "注文・提供", desc: "ワンタップで注文。来店と紐付いて売上に自動反映。" },
              { num: 4, icon: <CreditCard />, title: "精算", desc: "現金・カード・電子マネー対応。未精算の取りこぼし防止。" },
              { num: 5, icon: <ClipboardCheck />, title: "締め処理", desc: "売上確定、支払方法別内訳、レジ差異の確認まで完結。" },
            ].map((s, i) => (
              <div key={i} className="flex items-start flex-shrink-0" style={{ width: "19%" }}>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-6 h-6 rounded-full bg-[#3a8f7c] text-white flex items-center justify-center text-[11px] font-bold">{s.num}</div>
                    <span className="text-[#3a8f7c] [&>svg]:w-3.5 [&>svg]:h-3.5">{s.icon}</span>
                    <span className="text-[13px] font-semibold text-[#2c3e50]">{s.title}</span>
                  </div>
                  <p className="text-[11px] text-[#5a6977] leading-[1.6]">{s.desc}</p>
                </div>
                {i < 4 && <ChevronRight className="w-4 h-4 text-[#d8d3cc] mt-1.5 mx-1 flex-shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 機能 ===== */}
      <section id="features" className="py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Features</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50] mb-1">店舗運営に必要な機能をすべて搭載</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-1">
            <Feature icon={<Grid3X3 />} title="卓管理" desc="トナメ・リング・サイドをビジュアル管理。D&D配置、ディーラー管理。" />
            <Feature icon={<DoorOpen />} title="入退店管理" desc="来店から精算まで一連管理。未配置・未精算を一目で把握。" />
            <Feature icon={<ShoppingBag />} title="注文・精算" desc="来店と紐付けた注文。支払方法選択で精算。売上自動集計。" />
            <Feature icon={<Users />} title="顧客管理" desc="来店履歴・チップ・ポイント・ランクを一元管理。" />
            <Feature icon={<Coins />} title="チップ・ポイント" desc="履歴ベースの残高管理。来店ポイント自動付与にも対応。" />
            <Feature icon={<Clock />} title="勤怠・シフト" desc="LINE打刻、タイムラインでシフト作成、承認フロー付き。" />
            <Feature icon={<BarChart3 />} title="ダッシュボード" desc="売上・来店・稼働卓をリアルタイム。タイムラインで全体把握。" />
            <Feature icon={<Shield />} title="セキュリティ" desc="RLSでデータ保護。顧客は自分だけ、スタッフは自店舗のみ。" />
          </div>
        </div>
      </section>

      {/* ===== 導入メリット ===== */}
      <section id="merit" className="bg-white py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Benefits</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50]">導入するメリット</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Benefit icon={<Zap />} title="業務時間を大幅削減" desc="入退店から締めまで一気通貫。1日2〜3時間の削減効果。" />
            <Benefit icon={<TrendingDown />} title="売上ロスを防止" desc="未精算の取りこぼし、チップ不一致、レジ差異を自動検知。" />
            <Benefit icon={<UserCheck />} title="顧客満足度を向上" desc="VIP・常連を自動識別。来店履歴を全スタッフで共有。" />
            <Benefit icon={<Smartphone />} title="スタッフの負担を軽減" desc="シフト・勤怠・給与明細がスマホ完結。定着率UP。" />
            <Benefit icon={<BarChart3 />} title="経営判断を高速化" desc="売上・客単価・稼働率をリアルタイム把握。データ経営。" />
            <Benefit icon={<Building2 />} title="多店舗展開にも対応" desc="店舗別データ分離。2号店・3号店にそのまま導入可能。" />
          </div>
        </div>
      </section>

      {/* ===== LINE連携 ===== */}
      <section className="py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="flex flex-col lg:flex-row gap-10 items-center">
            <div className="lg:w-1/2">
              <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">LINE Integration</p>
              <h2 className="text-[20px] font-bold text-[#2c3e50] mb-3">LINEから、すべてが動く</h2>
              <p className="text-[13px] text-[#5a6977] leading-[1.8] mb-5">
                専用アプリ不要。LINEさえあれば、スタッフも顧客もすぐに使い始められます。
              </p>
              <div className="space-y-2">
                <LineFeature icon={<Smartphone />} text="スタッフ: 出退勤・卓確認・チップ付与" />
                <LineFeature icon={<Users />} text="顧客: 来店登録・チップ確認・イベント予約" />
                <LineFeature icon={<LineChart />} text="管理者: 売上速報・アラート通知" />
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="bg-[#faf8f5] border border-[#e8e4df] rounded-[16px] p-5 w-[240px]">
                <div className="flex items-center gap-2 mb-3">
                  <Image src="/logo-icon.png" alt="みえるくん" width={20} height={20} />
                  <span className="text-[12px] font-bold text-[#2c3e50]">てんぽみえるくん</span>
                </div>
                <div className="space-y-1.5">
                  {["出退勤", "卓確認", "チップ付与", "来店登録"].map((l, i) => (
                    <div key={i} className="bg-white border border-[#e8e4df] rounded-[6px] px-3 py-2 text-[11px] font-medium text-[#2c3e50] flex items-center justify-between">
                      {l}<ChevronRight className="w-3 h-3 text-[#d8d3cc]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 導入3ステップ ===== */}
      <section className="bg-white py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16 text-center">
          <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Getting Started</p>
          <h2 className="text-[20px] font-bold text-[#2c3e50] mb-8">3ステップで始められます</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <Step num="1" title="デモで体験" desc="アカウント不要。今すぐ全機能をお試しください。" />
            <Step num="2" title="プランを選択" desc="店舗の規模に合わせて最適なプランをお選びください。" />
            <Step num="3" title="即日スタート" desc="初期設定は最短30分。その日から運用を開始できます。" />
          </div>
        </div>
      </section>

      {/* ===== 料金 ===== */}
      <section id="pricing" className="py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Pricing</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50] mb-1">シンプルな料金体系</h2>
            <p className="text-[13px] text-[#5a6977]">初期費用0円。必要な分だけお支払い</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            <PricePlan name="スターター" price="¥9,800" unit="/月" desc="1店舗・5名まで" features={["入退店・卓管理", "注文・精算", "顧客管理", "ダッシュボード", "LINE連携（スタッフ）"]} />
            <PricePlan name="スタンダード" price="¥19,800" unit="/月" desc="1店舗・15名まで" features={["スターターの全機能", "チップ・ポイント管理", "勤怠・シフト管理", "締め処理・履歴", "PDF出力", "LINE連携（顧客）"]} highlight />
            <PricePlan name="プレミアム" price="¥39,800" unit="/月" desc="多店舗・無制限" features={["スタンダードの全機能", "多店舗対応", "経営分析・レポート", "API連携", "優先サポート"]} />
          </div>
          <p className="text-center text-[11px] text-[#8e9baa] mt-5">※ 全プラン初期費用0円。年払いで2ヶ月分無料。</p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="bg-white py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">FAQ</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50]">よくある質問</h2>
          </div>
          <div className="space-y-0">
            <FAQ q="導入にどのくらい時間がかかりますか？" a="アカウント作成後、初期設定は最短30分で完了します。商品マスタや卓の設定を行えば、その日から運用を開始できます。" />
            <FAQ q="既存の顧客データを移行できますか？" a="CSVインポート機能を用意しています。Excelや他システムからのデータ移行をサポートします。" />
            <FAQ q="インターネット環境は必要ですか？" a="はい。Webベースのシステムのため、安定したインターネット接続が必要です。スマートフォンのテザリングでも利用可能です。" />
            <FAQ q="複数店舗で利用できますか？" a="プレミアムプランで多店舗対応しています。店舗ごとにデータは完全に分離され、セキュリティも担保されます。" />
            <FAQ q="LINE連携には何が必要ですか？" a="LINE公式アカウントの開設が必要です。設定方法はマニュアルでご案内します。顧客・スタッフともにLINEアプリがあれば利用可能です。" />
            <FAQ q="解約はいつでもできますか？" a="はい。月額プランの場合、いつでも解約可能です。違約金はありません。データのエクスポートにも対応しています。" />
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-[#2c3e50] py-14">
        <div className="text-center">
          <Image src="/logo-icon.png" alt="みえるくん" width={44} height={44} className="mx-auto mb-3" />
          <h3 className="text-[18px] font-bold text-white mb-2">まずは無料で触ってみてください</h3>
          <p className="text-[13px] text-white/50 mb-6">アカウント登録不要。デモモードで全機能をお試しいただけます</p>
          <div className="flex justify-center gap-3">
            <button onClick={handleDemo} className="group flex items-center gap-2 px-7 py-2.5 text-[14px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69]">
              デモを体験する<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link href="/my" className="px-5 py-2.5 text-[13px] font-medium border border-white/20 text-white/70 rounded-[6px] hover:bg-white/5">顧客マイページ</Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-white border-t border-[#e8e4df] py-6">
        <div className="w-full px-8 md:px-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="みえるくん" width={18} height={18} />
            <span className="text-[11px] text-[#8e9baa]">&copy; {new Date().getFullYear()} てんぽみえるくん</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#8e9baa]">
            <a href="#features" className="hover:text-[#5a6977]">機能</a>
            <a href="#pricing" className="hover:text-[#5a6977]">料金</a>
            <a href="#faq" className="hover:text-[#5a6977]">FAQ</a>
            <Link href="/login" className="hover:text-[#5a6977]">ログイン</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===== コンポーネント =====

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-[28px] font-black text-[#3a8f7c] tracking-tight">{value}</p>
      <p className="text-[12px] text-[#5a6977] mt-1">{label}</p>
    </div>
  );
}

function ProblemSolution({ problem, solution }: { problem: string; solution: string }) {
  return (
    <div className="flex items-start gap-4 py-3 border-b border-[#f3f0ec]">
      <div className="flex-1 flex items-start gap-2">
        <Minus className="w-3.5 h-3.5 text-[#c0392b] mt-0.5 flex-shrink-0" />
        <span className="text-[13px] text-[#5a6977]">{problem}</span>
      </div>
      <ArrowRight className="w-4 h-4 text-[#d8d3cc] mt-0.5 flex-shrink-0" />
      <div className="flex-1 flex items-start gap-2">
        <Check className="w-3.5 h-3.5 text-[#3a8f7c] mt-0.5 flex-shrink-0" />
        <span className="text-[13px] text-[#2c3e50] font-medium">{solution}</span>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="py-3 border-b border-[#f3f0ec]">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[#3a8f7c] [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
        <h3 className="text-[13px] font-semibold text-[#2c3e50]">{title}</h3>
      </div>
      <p className="text-[11px] text-[#5a6977] leading-[1.6]">{desc}</p>
    </div>
  );
}

function Benefit({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-[6px] bg-[#e8f5f0] flex items-center justify-center flex-shrink-0 text-[#3a8f7c] [&>svg]:w-4 [&>svg]:h-4">{icon}</div>
      <div>
        <h3 className="text-[14px] font-semibold text-[#2c3e50] mb-1">{title}</h3>
        <p className="text-[12px] text-[#5a6977] leading-[1.6]">{desc}</p>
      </div>
    </div>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div>
      <div className="w-10 h-10 rounded-full border-2 border-[#3a8f7c] text-[#3a8f7c] flex items-center justify-center text-[16px] font-bold mx-auto mb-3">{num}</div>
      <h3 className="text-[14px] font-semibold text-[#2c3e50] mb-1">{title}</h3>
      <p className="text-[12px] text-[#5a6977]">{desc}</p>
    </div>
  );
}

function LineFeature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[#3a8f7c] [&>svg]:w-3.5 [&>svg]:h-3.5">{icon}</span>
      <span className="text-[13px] text-[#2c3e50]">{text}</span>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#f3f0ec]">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3.5 text-left">
        <span className="text-[13px] font-medium text-[#2c3e50]">{q}</span>
        <ChevronDown className={`w-4 h-4 text-[#8e9baa] flex-shrink-0 ml-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-[12px] text-[#5a6977] leading-[1.7] pb-3.5">{a}</p>}
    </div>
  );
}

function PricePlan({ name, price, unit, desc, features, highlight }: {
  name: string; price: string; unit: string; desc: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div className={`rounded-[8px] p-5 ${highlight ? "border-2 border-[#3a8f7c] bg-[#f0f9f6]" : "border border-[#e8e4df] bg-white"}`}>
      {highlight && <span className="text-[10px] font-semibold text-[#3a8f7c] uppercase tracking-wider">おすすめ</span>}
      <h3 className="text-[15px] font-bold text-[#2c3e50] mt-1">{name}</h3>
      <div className="flex items-baseline gap-0.5 mt-2 mb-1">
        <span className="text-[26px] font-black text-[#2c3e50]">{price}</span>
        <span className="text-[11px] text-[#8e9baa]">{unit}</span>
      </div>
      <p className="text-[11px] text-[#8e9baa] mb-3">{desc}</p>
      <div className="space-y-1.5">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] text-[#5a6977]">
            <Check className="w-3 h-3 text-[#3a8f7c] flex-shrink-0" />{f}
          </div>
        ))}
      </div>
    </div>
  );
}
