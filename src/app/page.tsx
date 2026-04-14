"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight, ChevronRight, Check,
  DoorOpen, Grid3X3, ShoppingBag, CreditCard, ClipboardCheck, Clock,
  Users, Coins, BarChart3, Shield, Smartphone, LineChart,
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
            <a href="#features" className="hover:text-[#2c3e50]">機能</a>
            <a href="#flow" className="hover:text-[#2c3e50]">運営フロー</a>
            <a href="#merit" className="hover:text-[#2c3e50]">導入メリット</a>
            <a href="#pricing" className="hover:text-[#2c3e50]">料金</a>
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
        <div className="relative w-full px-8 md:px-16 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-center">
            <div className="w-full lg:w-[48%] lg:pl-4">
              <Image src="/logo-full.png" alt="てんぽみえるくん" width={300} height={75} className="mb-6" />
              <p className="text-[12px] font-medium text-[#3a8f7c] mb-3 tracking-wide">アミューズメントカジノ専用 店舗運営システム</p>
              <h1 className="text-[28px] md:text-[38px] font-bold text-[#2c3e50] leading-[1.25] mb-5 tracking-tight">
                入退店から精算、勤怠まで。<br />
                店舗運営を<span className="text-[#3a8f7c]">ひとつの画面</span>に。
              </h1>
              <p className="text-[15px] text-[#5a6977] leading-[1.8] mb-8">
                アミューズメントカジノの現場に特化した店舗管理SaaS。
                顧客の入退店、ポーカーテーブルへの配置、ドリンク注文、チップ管理、
                スタッフの勤怠やシフトまで、日々の運営業務をワンストップで管理できます。
                LINEとの連携で、スタッフも顧客もスマホから操作可能です。
              </p>
              <div className="flex flex-wrap gap-3 mb-6">
                <button onClick={handleDemo} className="group flex items-center gap-2 px-7 py-3 text-[14px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69] shadow-sm">
                  無料でデモを体験<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <a href="#pricing" className="px-6 py-3 text-[14px] font-medium border border-[#d1ccc5] text-[#5a6977] rounded-[6px] hover:bg-white hover:border-[#b8b3ab]">
                  料金を見る
                </a>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-[#8e9baa]">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#3a8f7c]" />初期費用0円</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#3a8f7c]" />最短即日導入</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-[#3a8f7c]" />LINE連携対応</span>
              </div>
            </div>

            {/* 右: スクリーンショット風 */}
            <div className="w-full lg:w-[52%]">
              <div className="bg-white border border-[#e8e4df] rounded-[12px] overflow-hidden shadow-sm">
                <div className="h-8 bg-[#f3f0ec] border-b border-[#e8e4df] flex items-center px-3 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#d8d3cc]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#d8d3cc]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#d8d3cc]" />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4 text-[13px]">
                    <span className="text-[#8e9baa]">来店 <strong className="text-[#2c3e50]">8名</strong></span>
                    <span className="text-[#8e9baa]">稼働卓 <strong className="text-[#2c3e50]">3/4</strong></span>
                    <span className="text-[#8e9baa]">出勤 <strong className="text-[#2c3e50]">4名</strong></span>
                    <span className="text-[#c0392b] font-medium">未精算 0件</span>
                  </div>
                  <div className="space-y-1.5 text-[12px]">
                    {[
                      { time: "21:00", type: "入店", name: "山本 翔太", color: "#3a8f7c" },
                      { time: "20:45", type: "入店", name: "渡辺 優子", color: "#3a8f7c" },
                      { time: "20:30", type: "注文", name: "田中 太郎", color: "#3a8f7c" },
                      { time: "20:00", type: "イベント", name: "VIPナイト 開始", color: "#7c3aed" },
                      { time: "18:15", type: "出勤", name: "高橋 健", color: "#2c3e50" },
                    ].map((ev, i) => (
                      <div key={i} className="flex items-center gap-3 py-1">
                        <span className="text-[#8e9baa] font-mono w-10">{ev.time}</span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
                        <span className="text-[10px] font-semibold uppercase" style={{ color: ev.color }}>{ev.type}</span>
                        <span className="text-[#2c3e50] font-medium">{ev.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 課題セクション ===== */}
      <section className="bg-white py-16 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16 text-center">
          <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Problem</p>
          <h2 className="text-[22px] font-bold text-[#2c3e50] mb-4">こんなお悩みありませんか？</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-8 text-left">
            <Problem text="入退店の記録が手書きやExcelで、リアルタイムに状況が把握できない" />
            <Problem text="卓の空席状況やディーラー配置を一目で確認できず、配置に時間がかかる" />
            <Problem text="チップ・ポイントの残高管理が煩雑で、ミスやトラブルが起きやすい" />
            <Problem text="スタッフのシフト作成や勤怠管理を別々のツールで行っている" />
            <Problem text="日次の売上締めに時間がかかり、レジ差異の原因追跡が困難" />
            <Problem text="顧客情報が共有されず、VIPや常連への適切な対応ができていない" />
          </div>
        </div>
      </section>

      {/* ===== 運営フロー ===== */}
      <section id="flow" className="py-16 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-10">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Operation Flow</p>
            <h2 className="text-[22px] font-bold text-[#2c3e50] mb-2">1日の運営がそのままシステムに</h2>
            <p className="text-[14px] text-[#5a6977]">開店から締めまで、業務の流れに沿って自然に操作できます</p>
          </div>
          <div className="grid md:grid-cols-5 gap-4">
            <FlowCard num={1} icon={<DoorOpen />} title="入店登録" desc="来店した顧客を登録。QRコードやLINEからの入店にも対応。VIP・常連は自動識別されます。" />
            <FlowCard num={2} icon={<Grid3X3 />} title="卓に配置" desc="ポーカーテーブルにドラッグ&ドロップで配置。トナメ・リング・サイドの卓種別やディーラーも管理。" />
            <FlowCard num={3} icon={<ShoppingBag />} title="注文・提供" desc="ドリンク・フード・チップをワンタップで注文。注文は来店と紐付き、自動で売上に反映されます。" />
            <FlowCard num={4} icon={<CreditCard />} title="精算" desc="現金・カード・電子マネーに対応。未精算の一覧管理で取りこぼしを防止します。" />
            <FlowCard num={5} icon={<ClipboardCheck />} title="締め処理" desc="1日の売上を確定。支払方法別の内訳やレジ差異の確認、メモの記録もここで完結します。" />
          </div>
        </div>
      </section>

      {/* ===== 機能一覧 ===== */}
      <section id="features" className="bg-white py-16 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-10">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Features</p>
            <h2 className="text-[22px] font-bold text-[#2c3e50] mb-2">店舗運営に必要な機能をすべて搭載</h2>
            <p className="text-[14px] text-[#5a6977]">複数のツールを使い分ける必要はもうありません</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <Feature icon={<Grid3X3 />} title="卓管理" desc="トナメ・リング・サイドの卓をビジュアルで管理。席の配置はドラッグ&ドロップ。ディーラーの配置時間も記録。" />
            <Feature icon={<DoorOpen />} title="入退店管理" desc="来店から精算までの一連を管理。未配置・未精算の顧客を一目で把握。VIP・常連タグで接客をサポート。" />
            <Feature icon={<ShoppingBag />} title="注文・精算" desc="商品マスタから注文を作成し、来店と紐付け。精算は支払方法を選択するだけ。売上は自動集計。" />
            <Feature icon={<Users />} title="顧客管理" desc="来店履歴・チップ残高・ポイント・ランクを一元管理。VIP対応やプライズ付与もここから。" />
            <Feature icon={<Coins />} title="チップ・ポイント" desc="チップの付与・使用を履歴管理。ポイントは来店時自動付与にも対応。残高は常に最新を表示。" />
            <Feature icon={<Clock />} title="勤怠・シフト" desc="LINEから出退勤打刻。シフトはタイムラインUIで直感作成。勤怠修正は承認フロー付き。PDF出力も対応。" />
            <Feature icon={<BarChart3 />} title="ダッシュボード" desc="売上・来店数・客単価・稼働卓をリアルタイム表示。タイムラインで店舗の動きを時系列で把握。" />
            <Feature icon={<Shield />} title="セキュリティ" desc="SupabaseのRLSによるデータ保護。顧客は自分のデータのみ、スタッフは自店舗のみアクセス可能。" />
          </div>
        </div>
      </section>

      {/* ===== 導入メリット ===== */}
      <section id="merit" className="py-16 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-10">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Benefits</p>
            <h2 className="text-[22px] font-bold text-[#2c3e50] mb-2">導入するメリット</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Benefit num="01" title="業務時間の大幅削減" desc="手書き管理やExcel集計が不要に。入退店から締めまで一気通貫で処理でき、1日あたり2〜3時間の業務削減が見込めます。" />
            <Benefit num="02" title="売上ロスの防止" desc="未精算の取りこぼし、チップ残高の不一致、レジ差異を自動検知。データの整合性が担保され、売上ロスを最小化します。" />
            <Benefit num="03" title="顧客満足度の向上" desc="VIP・常連を自動識別し、来店履歴やチップ残高をスタッフ全員が共有。一人ひとりに合った接客が可能になります。" />
            <Benefit num="04" title="スタッフの定着率UP" desc="シフト作成や勤怠管理がスマホで完結。給与明細もLINEで確認可能。スタッフの負担を減らし、働きやすい環境を実現。" />
            <Benefit num="05" title="経営判断の高速化" desc="売上・来店数・客単価・稼働率をリアルタイムで把握。日次締めの履歴から傾向分析も可能。データに基づく意思決定を支援。" />
            <Benefit num="06" title="多店舗展開にも対応" desc="店舗ごとのデータは完全に分離。将来の2号店・3号店にもそのまま導入可能な設計です。" />
          </div>
        </div>
      </section>

      {/* ===== LINE連携 ===== */}
      <section className="bg-white py-16 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">LINE Integration</p>
              <h2 className="text-[22px] font-bold text-[#2c3e50] mb-4">LINEから、すべてが動く</h2>
              <p className="text-[14px] text-[#5a6977] leading-[1.8] mb-6">
                スタッフはLINEから出退勤の打刻、卓の確認、チップの付与が可能。
                顧客はQRコードで来店登録、チップ残高の確認、イベントの予約ができます。
                専用アプリのインストールは不要。LINEさえあれば、すぐに使い始められます。
              </p>
              <div className="space-y-2">
                <LineFeature icon={<Smartphone />} text="スタッフ: 出退勤・卓確認・チップ付与" />
                <LineFeature icon={<Users />} text="顧客: 来店登録・チップ確認・イベント予約" />
                <LineFeature icon={<LineChart />} text="管理者: 売上速報・アラート通知" />
              </div>
            </div>
            <div className="lg:w-1/2 flex justify-center">
              <div className="bg-[#faf8f5] border border-[#e8e4df] rounded-[20px] p-6 w-[260px]">
                <div className="flex items-center gap-2 mb-4">
                  <Image src="/logo-icon.png" alt="みえるくん" width={24} height={24} />
                  <span className="text-[13px] font-bold text-[#2c3e50]">てんぽみえるくん</span>
                </div>
                <div className="space-y-2">
                  {["出退勤", "卓確認", "チップ付与", "来店登録"].map((label, i) => (
                    <div key={i} className="bg-white border border-[#e8e4df] rounded-[8px] px-3 py-2.5 text-[12px] font-medium text-[#2c3e50] flex items-center justify-between">
                      {label}<ChevronRight className="w-3.5 h-3.5 text-[#d8d3cc]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 料金 ===== */}
      <section id="pricing" className="py-16 border-t border-[#e8e4df]">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-10">
            <p className="text-[12px] font-medium text-[#3a8f7c] mb-2 uppercase tracking-wider">Pricing</p>
            <h2 className="text-[22px] font-bold text-[#2c3e50] mb-2">シンプルな料金体系</h2>
            <p className="text-[14px] text-[#5a6977]">初期費用0円。必要な分だけお支払い</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <PricePlan name="スターター" price="¥9,800" unit="/月" desc="1店舗・5名まで" features={["入退店・卓管理", "注文・精算", "顧客管理", "ダッシュボード", "LINE連携（スタッフ）"]} />
            <PricePlan name="スタンダード" price="¥19,800" unit="/月" desc="1店舗・15名まで" features={["スターターの全機能", "チップ・ポイント管理", "勤怠・シフト管理", "締め処理・履歴", "PDF出力", "LINE連携（顧客）"]} highlight />
            <PricePlan name="プレミアム" price="¥39,800" unit="/月" desc="多店舗・無制限" features={["スタンダードの全機能", "多店舗対応", "経営分析・レポート", "API連携", "優先サポート", "カスタマイズ対応"]} />
          </div>
          <p className="text-center text-[12px] text-[#8e9baa] mt-6">※ 全プラン初期費用0円。年払いで2ヶ月分無料。</p>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="bg-[#2c3e50] py-16">
        <div className="text-center">
          <Image src="/logo-icon.png" alt="みえるくん" width={48} height={48} className="mx-auto mb-4" />
          <h3 className="text-[20px] font-bold text-white mb-2">まずは無料で触ってみてください</h3>
          <p className="text-[14px] text-white/60 mb-8">アカウント登録不要。デモモードで全機能をお試しいただけます</p>
          <div className="flex justify-center gap-3">
            <button onClick={handleDemo} className="group flex items-center gap-2 px-8 py-3 text-[14px] font-medium bg-[#3a8f7c] text-white rounded-[6px] hover:bg-[#2f7a69] shadow-sm">
              デモを体験する<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <Link href="/my" className="px-6 py-3 text-[14px] font-medium border border-white/20 text-white/80 rounded-[6px] hover:bg-white/5">
              顧客マイページ
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-white border-t border-[#e8e4df] py-8">
        <div className="w-full px-8 md:px-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo-icon.png" alt="みえるくん" width={20} height={20} />
            <span className="text-[12px] text-[#8e9baa]">&copy; {new Date().getFullYear()} てんぽみえるくん</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-[#8e9baa]">
            <a href="#features" className="hover:text-[#5a6977]">機能</a>
            <a href="#pricing" className="hover:text-[#5a6977]">料金</a>
            <Link href="/login" className="hover:text-[#5a6977]">ログイン</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ===== コンポーネント =====

function Problem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#f3f0ec] last:border-0">
      <span className="text-[#c0392b] text-[14px] mt-0.5">✕</span>
      <p className="text-[13px] text-[#5a6977] leading-relaxed">{text}</p>
    </div>
  );
}

function FlowCard({ num, icon, title, desc }: { num: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-full bg-[#3a8f7c] text-white flex items-center justify-center text-[12px] font-bold">{num}</div>
        <span className="text-[#3a8f7c] [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        <span className="text-[14px] font-semibold text-[#2c3e50]">{title}</span>
      </div>
      <p className="text-[12px] text-[#5a6977] leading-[1.7]">{desc}</p>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="py-4 border-b border-[#f3f0ec]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[#3a8f7c] [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
        <h3 className="text-[14px] font-semibold text-[#2c3e50]">{title}</h3>
      </div>
      <p className="text-[12px] text-[#5a6977] leading-[1.7]">{desc}</p>
    </div>
  );
}

function Benefit({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="py-4">
      <span className="text-[24px] font-black text-[#3a8f7c]/20">{num}</span>
      <h3 className="text-[15px] font-semibold text-[#2c3e50] mt-1 mb-2">{title}</h3>
      <p className="text-[12px] text-[#5a6977] leading-[1.7]">{desc}</p>
    </div>
  );
}

function LineFeature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[#3a8f7c] [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
      <span className="text-[13px] text-[#2c3e50]">{text}</span>
    </div>
  );
}

function PricePlan({ name, price, unit, desc, features, highlight }: {
  name: string; price: string; unit: string; desc: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div className={`rounded-[8px] p-6 ${highlight ? "border-2 border-[#3a8f7c] bg-[#f0f9f6]" : "border border-[#e8e4df] bg-white"}`}>
      {highlight && <span className="text-[10px] font-semibold text-[#3a8f7c] uppercase tracking-wider">おすすめ</span>}
      <h3 className="text-[16px] font-bold text-[#2c3e50] mt-1">{name}</h3>
      <div className="flex items-baseline gap-1 mt-2 mb-1">
        <span className="text-[28px] font-black text-[#2c3e50]">{price}</span>
        <span className="text-[12px] text-[#8e9baa]">{unit}</span>
      </div>
      <p className="text-[11px] text-[#8e9baa] mb-4">{desc}</p>
      <div className="space-y-1.5">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px] text-[#5a6977]">
            <Check className="w-3 h-3 text-[#3a8f7c] flex-shrink-0" />{f}
          </div>
        ))}
      </div>
    </div>
  );
}
