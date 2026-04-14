"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight, ChevronRight, ChevronDown, Check, Minus,
  DoorOpen, Grid3X3, ShoppingBag, CreditCard, ClipboardCheck, Clock,
  Users, Coins, BarChart3, Shield, Smartphone, LineChart,
  Zap, TrendingDown, UserCheck, Building2,
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
            <a href="#flow" className="hover:text-[#2c3e50]">運営フロー</a>
            <a href="#features" className="hover:text-[#2c3e50]">機能</a>
            <a href="#merit" className="hover:text-[#2c3e50]">メリット</a>
            <a href="#pricing" className="hover:text-[#2c3e50]">料金</a>
            <a href="#faq" className="hover:text-[#2c3e50]">FAQ</a>
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
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-center">
            <div className="w-full lg:w-[50%] lg:pl-4">
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

            {/* 右: 実際のダッシュボード画面 */}
            <div className="w-full lg:w-[50%]">
              <div className="bg-white border border-[#e8e4df] rounded-[12px] overflow-hidden shadow-sm">
                <div className="h-7 bg-[#f3f0ec] border-b border-[#e8e4df] flex items-center px-3 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#d8d3cc]" /><div className="w-2 h-2 rounded-full bg-[#d8d3cc]" /><div className="w-2 h-2 rounded-full bg-[#d8d3cc]" />
                  <span className="text-[9px] text-[#8e9baa] ml-2">てんぽみえるくん — ダッシュボード</span>
                </div>
                <div className="relative h-[420px] overflow-hidden">
                  <iframe
                    src="/dashboard"
                    className="absolute top-0 left-0 border-0 pointer-events-none"
                    style={{ width: "200%", height: "200%", transform: "scale(0.5)", transformOrigin: "top left" }}
                    tabIndex={-1}
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#8e9baa] text-center mt-2">※ 実際のダッシュボード画面です</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 数字 ===== */}
      <section className="bg-white py-10 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <Stat value="2〜3h" label="1日の業務削減時間" />
          <Stat value="0円" label="初期導入費用" />
          <Stat value="即日" label="最短導入期間" />
          <Stat value="99.9%" label="サービス稼働率" />
        </div>
      </section>

      {/* ===== Before → After（詳細版） ===== */}
      <section className="py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Before → After</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50]">こんな課題を、こう解決します</h2>
          </div>

          <div className="space-y-12">
            {[
              {
                beforeImg: "/illustrations/before-checkin.png", afterImg: "/illustrations/after-checkin.png",
                problem: "入退店の記録が追いつかない",
                problemDesc: "来店した顧客を紙の名簿に手書きで記録。混雑時には記入漏れが発生し、「今、店内に何人いるのか」すら正確に把握できない。Excelで集計しようにも営業中にPCを開く余裕がなく、翌日にまとめて入力する日も。",
                solution: "リアルタイムタイムラインで全体把握",
                solutionDesc: "入店と同時にシステムに記録。店内の顧客数・未配置・未精算がリアルタイムで画面に表示されます。誰がいつ来て、どの卓にいて、いくら使っているかが一目瞭然。",
              },
              {
                beforeImg: "/illustrations/before-table.png", afterImg: "/illustrations/after-table.png",
                problem: "卓の配置に手間取り、お客様を待たせてしまう",
                problemDesc: "空いている卓を探すのにフロアを歩き回り、ディーラーの配置も口頭で確認。ピーク時にはどの卓が満席でどこに空きがあるかわからず、VIPのお客様を待たせてしまうことも。",
                solution: "ビジュアル卓管理でドラッグ&ドロップ配置",
                solutionDesc: "画面上にポーカーテーブルを再現。空席が一目でわかり、顧客をドラッグして卓に配置するだけ。ディーラーの配置時間も記録でき、交代のタイミングも管理できます。",
              },
              {
                beforeImg: "/illustrations/before-chip.png", afterImg: "/illustrations/after-chip.png",
                problem: "チップ残高が合わない、トラブルになる",
                problemDesc: "チップの付与・使用をその場でメモするが、後から集計するとお客様の残高と店舗の記録が一致しない。「もらったはず」「使ってない」の水掛け論になり、信頼を損なうことも。",
                solution: "履歴ベースの残高管理で整合性を自動担保",
                solutionDesc: "チップの増減はすべて履歴として記録。残高は履歴から自動計算されるため、手入力による不一致が起きません。いつ・誰が・いくら操作したかも完全に追跡可能。",
              },
              {
                beforeImg: "/illustrations/before-shift.png", afterImg: "/illustrations/after-shift.png",
                problem: "シフトと勤怠が別管理で二度手間",
                problemDesc: "シフトはLINEグループで希望を集めてExcelで作成。勤怠はタイムカードで記録し、月末に手計算で給与に反映。修正が入るたびにやり取りが発生し、管理者の負担が大きい。",
                solution: "タイムラインUIでシフト作成、LINEで出退勤打刻",
                solutionDesc: "シフトはドラッグ操作で直感的に作成。スタッフはLINEからワンタップで出退勤を打刻。勤務時間は分単位で自動計算され、修正には承認フローが付くので改ざんも防止。",
              },
              {
                beforeImg: "/illustrations/before-closing.png", afterImg: "/illustrations/after-closing.png",
                problem: "日次の締めに1時間かかる",
                problemDesc: "レジの現金を数え、カード売上と照合し、差異があれば原因を探す。売上の内訳を手計算でまとめてノートに記録。この作業に毎晩1時間以上かかっている。",
                solution: "ワンクリック締め処理、差異自動検知",
                solutionDesc: "当日の注文・精算データから売上を自動集計。支払方法別の内訳、未精算の有無、レジ差異もシステムが検出。メモを添えて「締め実行」を押すだけで完了します。",
              },
            ].map((item, i) => (
              <div key={i} className="pb-12 border-b border-[#f3f0ec] last:border-0 last:pb-0">
                {/* Before: 文章（左）+ 画像（右） */}
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="md:w-[60%]">
                    <p className="text-[10px] font-semibold text-[#c0392b] uppercase tracking-wider mb-2">Before</p>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Minus className="w-3.5 h-3.5 text-[#c0392b] flex-shrink-0" />
                      <h3 className="text-[15px] font-semibold text-[#c0392b]">{item.problem}</h3>
                    </div>
                    <p className="text-[12px] text-[#5a6977] leading-[1.8]">{item.problemDesc}</p>
                  </div>
                  <div className="md:w-[40%] flex justify-center">
                    <Image src={item.beforeImg} alt={item.problem} width={240} height={240} className="object-contain" />
                  </div>
                </div>

                {/* 中央下矢印 */}
                <div className="flex justify-center py-4">
                  <div className="w-8 h-8 rounded-full bg-[#e8e4df] flex items-center justify-center">
                    <ChevronDown className="w-4 h-4 text-[#5a6977]" />
                  </div>
                </div>

                {/* After: 画像（左）+ 文章（右） */}
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="md:w-[40%] flex justify-center">
                    <Image src={item.afterImg} alt={item.solution} width={240} height={240} className="object-contain" />
                  </div>
                  <div className="md:w-[60%]">
                    <p className="text-[10px] font-semibold text-[#3a8f7c] uppercase tracking-wider mb-2">After</p>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Check className="w-3.5 h-3.5 text-[#3a8f7c] flex-shrink-0" />
                      <h3 className="text-[15px] font-semibold text-[#3a8f7c]">{item.solution}</h3>
                    </div>
                    <p className="text-[12px] text-[#2c3e50] leading-[1.8]">{item.solutionDesc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 中間CTA ===== */}
      <section className="py-10 border-t border-[#e8e4df] bg-[#f0f9f6]">
        <div className="text-center">
          <h3 className="text-[16px] font-bold text-[#2c3e50] mb-2">まずは無料で触ってみてください</h3>
          <p className="text-[12px] text-[#5a6977] mb-4">アカウント登録不要。デモモードで全機能をお試しいただけます</p>
          <button onClick={handleDemo} className="group inline-flex items-center gap-2 px-6 py-2.5 text-[14px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69]">
            デモを体験する<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ===== 運営フロー（縦） ===== */}
      <section id="flow" className="bg-white py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Operation Flow</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50] mb-1">1日の運営がそのままシステムに</h2>
            <p className="text-[13px] text-[#5a6977]">開店から締めまで、業務の流れに沿って操作できます</p>
          </div>
          <div className="relative">
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-[#e8e4df]" />
            {[
              { icon: <DoorOpen />, title: "入店登録", desc: "QRコード・LINEからの入店にも対応。VIP・常連は自動識別されます。" },
              { icon: <Grid3X3 />, title: "卓に配置", desc: "ポーカーテーブルにドラッグ&ドロップで配置。ディーラーも管理。" },
              { icon: <ShoppingBag />, title: "注文・提供", desc: "ワンタップで注文。来店と紐付いて売上に自動反映されます。" },
              { icon: <CreditCard />, title: "精算", desc: "現金・カード・電子マネーに対応。未精算の取りこぼしを防止。" },
              { icon: <ClipboardCheck />, title: "締め処理", desc: "売上確定、支払方法別内訳、レジ差異の確認まで完結。" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-4 mb-6 last:mb-0 relative">
                <div className="w-[30px] h-[30px] rounded-full bg-[#3a8f7c] text-white flex items-center justify-center text-[12px] font-bold flex-shrink-0 z-10">
                  {i + 1}
                </div>
                <div className="pt-0.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[#3a8f7c] [&>svg]:w-4 [&>svg]:h-4">{s.icon}</span>
                    <span className="text-[14px] font-semibold text-[#2c3e50]">{s.title}</span>
                  </div>
                  <p className="text-[12px] text-[#5a6977] leading-[1.7]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 機能（縦1列） ===== */}
      <section id="features" className="py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Features</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50] mb-1">店舗運営に必要な機能をすべて搭載</h2>
          </div>
          <div className="space-y-0">
            {[
              { icon: <Grid3X3 />, title: "卓管理", desc: "トナメ・リング・サイドの卓をビジュアルで管理。席の配置はドラッグ&ドロップ。ディーラーの配置時間も記録。" },
              { icon: <DoorOpen />, title: "入退店管理", desc: "来店から精算までの一連を管理。未配置・未精算の顧客を一目で把握。VIP・常連タグで接客をサポート。" },
              { icon: <ShoppingBag />, title: "注文・精算", desc: "商品マスタから注文を作成し、来店と紐付け。精算は支払方法を選択するだけ。売上は自動集計。" },
              { icon: <Users />, title: "顧客管理", desc: "来店履歴・チップ残高・ポイント・ランクを一元管理。VIP対応やプライズ付与もここから。" },
              { icon: <Coins />, title: "チップ・ポイント", desc: "チップの付与・使用を履歴管理。ポイントは来店時自動付与にも対応。残高は常に最新を表示。" },
              { icon: <Clock />, title: "勤怠・シフト", desc: "LINEから出退勤打刻。シフトはタイムラインUIで直感作成。勤怠修正は承認フロー付き。PDF出力も対応。" },
              { icon: <BarChart3 />, title: "ダッシュボード", desc: "売上・来店数・客単価・稼働卓をリアルタイム表示。タイムラインで店舗の動きを時系列で把握。" },
              { icon: <Shield />, title: "セキュリティ", desc: "RLSによるデータ保護。顧客は自分のデータのみ、スタッフは自店舗のみアクセス可能。監査ログも完備。" },
            ].map((f, i) => (
              <div key={i} className="flex items-start gap-3 py-4 border-b border-[#f3f0ec]">
                <div className="w-8 h-8 rounded-[6px] bg-[#e8f5f0] flex items-center justify-center flex-shrink-0 text-[#3a8f7c] [&>svg]:w-4 [&>svg]:h-4 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#2c3e50] mb-0.5">{f.title}</h3>
                  <p className="text-[12px] text-[#5a6977] leading-[1.7]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 導入メリット（縦1列） ===== */}
      <section id="merit" className="bg-white py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16 max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Benefits</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50]">導入するメリット</h2>
          </div>
          <div className="space-y-0">
            {[
              { icon: <Zap />, title: "業務時間を大幅削減", desc: "手書き管理やExcel集計が不要に。入退店から締めまで一気通貫で処理でき、1日あたり2〜3時間の業務削減が見込めます。" },
              { icon: <TrendingDown />, title: "売上ロスを防止", desc: "未精算の取りこぼし、チップ残高の不一致、レジ差異を自動検知。データの整合性が担保され、売上ロスを最小化します。" },
              { icon: <UserCheck />, title: "顧客満足度を向上", desc: "VIP・常連を自動識別し、来店履歴やチップ残高をスタッフ全員が共有。一人ひとりに合った接客が可能になります。" },
              { icon: <Smartphone />, title: "スタッフの負担を軽減", desc: "シフト作成や勤怠管理がスマホで完結。給与明細もLINEで確認可能。スタッフの負担を減らし、定着率UPに貢献。" },
              { icon: <BarChart3 />, title: "経営判断を高速化", desc: "売上・来店数・客単価・稼働率をリアルタイムで把握。日次締めの履歴から傾向分析も可能。データに基づく経営を支援。" },
              { icon: <Building2 />, title: "多店舗展開にも対応", desc: "店舗ごとのデータは完全に分離。将来の2号店・3号店にもそのまま導入可能な設計です。" },
            ].map((b, i) => (
              <div key={i} className="flex items-start gap-3 py-4 border-b border-[#f3f0ec]">
                <div className="w-8 h-8 rounded-[6px] bg-[#e8f5f0] flex items-center justify-center flex-shrink-0 text-[#3a8f7c] [&>svg]:w-4 [&>svg]:h-4 mt-0.5">
                  {b.icon}
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#2c3e50] mb-0.5">{b.title}</h3>
                  <p className="text-[12px] text-[#5a6977] leading-[1.7]">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LINE連携（2カラム・バランス調整） ===== */}
      <section className="py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16 max-w-4xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-[55%]">
              <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">LINE Integration</p>
              <h2 className="text-[20px] font-bold text-[#2c3e50] mb-3">LINEから、すべてが動く</h2>
              <p className="text-[13px] text-[#5a6977] leading-[1.8] mb-5">
                専用アプリのインストールは不要。LINEさえあれば、スタッフも顧客もすぐに使い始められます。
                出退勤の打刻、卓の確認、チップの付与、来店登録まで、すべてLINEの中で完結します。
              </p>
              <div className="space-y-3">
                {[
                  { icon: <Smartphone />, role: "スタッフ", items: "出退勤・卓確認・チップ付与" },
                  { icon: <Users />, role: "顧客", items: "来店登録・チップ確認・イベント予約" },
                  { icon: <LineChart />, role: "管理者", items: "売上速報・アラート通知" },
                ].map((l, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-[6px] bg-[#e8f5f0] flex items-center justify-center flex-shrink-0 text-[#3a8f7c] [&>svg]:w-3.5 [&>svg]:h-3.5">{l.icon}</div>
                    <div>
                      <span className="text-[12px] font-semibold text-[#2c3e50]">{l.role}</span>
                      <p className="text-[12px] text-[#5a6977]">{l.items}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-[45%] flex justify-center">
              <div className="bg-white border border-[#e8e4df] rounded-[16px] p-5 w-[260px] shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#f3f0ec]">
                  <Image src="/logo-icon.png" alt="みえるくん" width={22} height={22} />
                  <span className="text-[13px] font-bold text-[#2c3e50]">てんぽみえるくん</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "出退勤", sub: "打刻・履歴確認" },
                    { label: "卓確認", sub: "稼働状況を確認" },
                    { label: "チップ付与", sub: "顧客にチップを付与" },
                    { label: "来店登録", sub: "QRコードで入店" },
                  ].map((item, i) => (
                    <div key={i} className="bg-[#faf8f5] border border-[#e8e4df] rounded-[8px] px-3 py-2.5 flex items-center justify-between hover:bg-[#f3f0ec] cursor-pointer transition-colors">
                      <div>
                        <p className="text-[12px] font-medium text-[#2c3e50]">{item.label}</p>
                        <p className="text-[10px] text-[#8e9baa]">{item.sub}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#d8d3cc]" />
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
        <div className="w-full px-8 md:px-16 max-w-3xl mx-auto text-center">
          <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Getting Started</p>
          <h2 className="text-[20px] font-bold text-[#2c3e50] mb-8">3ステップで始められます</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { n: "1", t: "デモで体験", d: "アカウント不要。今すぐ全機能をお試しください。" },
              { n: "2", t: "プランを選択", d: "店舗の規模に合わせて最適なプランを。" },
              { n: "3", t: "即日スタート", d: "初期設定は最短30分。その日から運用開始。" },
            ].map((s, i) => (
              <div key={i}>
                <div className="w-10 h-10 rounded-full border-2 border-[#3a8f7c] text-[#3a8f7c] flex items-center justify-center text-[16px] font-bold mx-auto mb-2">{s.n}</div>
                <h3 className="text-[13px] font-semibold text-[#2c3e50] mb-1">{s.t}</h3>
                <p className="text-[11px] text-[#5a6977]">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 料金 ===== */}
      <section id="pricing" className="py-14 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16 max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Pricing</p>
            <h2 className="text-[20px] font-bold text-[#2c3e50] mb-1">シンプルな料金体系</h2>
            <p className="text-[13px] text-[#5a6977]">初期費用0円。必要な分だけお支払い</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
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
          {[
            { q: "導入にどのくらい時間がかかりますか？", a: "アカウント作成後、初期設定は最短30分で完了します。商品マスタや卓の設定を行えば、その日から運用を開始できます。" },
            { q: "既存の顧客データを移行できますか？", a: "CSVインポート機能を用意しています。Excelや他システムからのデータ移行をサポートします。" },
            { q: "インターネット環境は必要ですか？", a: "はい。Webベースのシステムのため、安定したインターネット接続が必要です。スマートフォンのテザリングでも利用可能です。" },
            { q: "複数店舗で利用できますか？", a: "プレミアムプランで多店舗対応しています。店舗ごとにデータは完全に分離され、セキュリティも担保されます。" },
            { q: "LINE連携には何が必要ですか？", a: "LINE公式アカウントの開設が必要です。設定方法はマニュアルでご案内します。" },
            { q: "解約はいつでもできますか？", a: "はい。月額プランの場合、いつでも解約可能です。違約金はありません。データのエクスポートにも対応しています。" },
          ].map((f, i) => <FAQ key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-[#2c3e50] py-14">
        <div className="text-center">
          <Image src="/logo-icon.png" alt="みえるくん" width={44} height={44} className="mx-auto mb-3" />
          <h3 className="text-[18px] font-bold text-white mb-2">まずは無料で触ってみてください</h3>
          <p className="text-[13px] text-white/50 mb-6">アカウント登録不要。デモモードで全機能をお試しいただけます</p>
          <button onClick={handleDemo} className="group inline-flex items-center gap-2 px-7 py-2.5 text-[14px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69]">
            デモを体験する<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
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

function Stat({ value, label }: { value: string; label: string }) {
  return <div><p className="text-[28px] font-black text-[#3a8f7c] tracking-tight">{value}</p><p className="text-[12px] text-[#5a6977] mt-1">{label}</p></div>;
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
