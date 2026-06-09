"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import {
  ArrowRight, ChevronRight, ChevronDown, Check, Minus,
  DoorOpen, Grid3X3, ShoppingBag, CreditCard, ClipboardCheck, Clock,
  Users, Coins, BarChart3, Shield, Smartphone, LineChart,
  Zap, TrendingDown, UserCheck, Building2,
} from "lucide-react";

export default function Home() {
  // プレビューiframeが /login にリダイレクトされないよう、
  // LP表示時にデモモードcookieをセットしてからiframeを描画する。
  const [previewReady, setPreviewReady] = useState(false);
  useEffect(() => {
    document.cookie = "demo_mode=true; path=/; max-age=86400; SameSite=Lax";
    setPreviewReady(true);
  }, []);

  function handleDemo() {
    document.cookie = "demo_mode=true; path=/; max-age=86400; SameSite=Lax";
    window.location.href = "/v2";
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-hover">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-border-light">
        <div className="w-full px-8 h-14 flex items-center justify-between">
          <Link href="/v2" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src="/logo-icon.png" alt="みえるくん" width={36} height={36} />
            <span className="text-[15px] font-bold text-text-primary tracking-tight">てんぽみえるくん</span>
          </Link>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-5 text-[13px] text-text-secondary">
              <a href="#flow" className="hover:text-text-primary">運営フロー</a>
              <a href="#problem" className="hover:text-text-primary">課題解決</a>
              <a href="#features" className="hover:text-text-primary">機能</a>
              <a href="#merit" className="hover:text-text-primary">メリット</a>
              <a href="#pricing" className="hover:text-text-primary">料金</a>
              <a href="#faq" className="hover:text-text-primary">FAQ</a>
            </nav>
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-3 py-[7px] text-[13px] font-medium text-text-secondary hover:text-text-primary">ログイン</Link>
              <button onClick={handleDemo} className="px-4 py-[7px] text-[13px] font-medium bg-accent text-white rounded-[6px] hover:bg-accent-hover">デモを見る</button>
            </div>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative bg-bg-hover overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] translate-x-1/4 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#e8c170]/8 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="relative w-full px-8 md:px-16 py-10 md:py-14">
          <div className="flex flex-col lg:flex-row gap-10 lg:gap-14 items-center">
            <div className="w-full lg:w-[50%] lg:pl-4">
              <Image src="/logo-full.png" alt="てんぽみえるくん" width={280} height={70} className="mb-5" />
              <p className="text-[12px] font-medium text-accent mb-3 tracking-wide">アミューズメントカジノ専用 店舗運営システム</p>
              <h1 className="text-[28px] md:text-[36px] font-bold text-text-primary leading-[1.25] mb-4 tracking-tight">
                入退店から精算、勤怠まで。<br />
                店舗運営を<span className="text-accent">ひとつの画面</span>に。
              </h1>
              <p className="text-[14px] text-text-secondary leading-[1.8] mb-6">
                ポーカーテーブルへの配置、ドリンク注文、チップ管理、スタッフの勤怠やシフトまで。
                LINEとの連携で、スタッフも顧客もスマホから操作可能。
              </p>
              <div className="flex flex-wrap gap-3 mb-5">
                <button onClick={handleDemo} className="group flex items-center gap-2 px-6 py-2.5 text-[14px] font-medium bg-accent text-white rounded-[6px] hover:bg-accent-hover shadow-sm">
                  無料でデモを体験<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <a href="#pricing" className="px-5 py-2.5 text-[14px] font-medium border border-[#d1ccc5] text-text-secondary rounded-[6px] hover:bg-white">料金を見る</a>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-text-tertiary">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-accent" />初期費用0円</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-accent" />最短即日導入</span>
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-accent" />LINE連携</span>
              </div>
            </div>

            {/* 右: 実際のダッシュボード画面 */}
            <div className="w-full lg:w-[50%]">
              <button
                onClick={handleDemo}
                className="block w-full text-left bg-white border border-border-light rounded-[12px] overflow-hidden shadow-sm hover:shadow-md hover:border-accent/40 transition-all group"
                aria-label="デモダッシュボードを開く"
              >
                <div className="h-7 bg-bg-hover border-b border-border-light flex items-center px-3 gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#d8d3cc]" /><div className="w-2 h-2 rounded-full bg-[#d8d3cc]" /><div className="w-2 h-2 rounded-full bg-[#d8d3cc]" />
                  <span className="text-[9px] text-text-tertiary ml-2">mieru-kun.vercel.app/dashboard</span>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden bg-bg-hover">
                  {previewReady ? (
                    <iframe
                      src="/v2"
                      className="absolute top-0 left-0 border-0 pointer-events-none"
                      style={{ width: "200%", height: "200%", transform: "scale(0.5)", transformOrigin: "top left" }}
                      tabIndex={-1}
                      title="ダッシュボードプレビュー"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {/* ホバー時のオーバーレイ */}
                  <div className="absolute inset-0 bg-gradient-to-t from-text-primary/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-6">
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-text-primary text-[13px] font-medium rounded-[6px] shadow-lg">
                      <ArrowRight className="w-3.5 h-3.5" />この画面を触ってみる
                    </span>
                  </div>
                </div>
              </button>
              <p className="text-[10px] text-text-tertiary text-center mt-2">※ 実際のダッシュボード画面(クリックでデモ体験)</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== 数字 ===== */}
      <section className="bg-white py-6 border-t border-border-light">
        <div className="w-full px-8 md:px-16 grid grid-cols-4 gap-4 text-center">
          <Stat value="2〜3h" label="1日の業務削減時間" />
          <Stat value="0円" label="初期導入費用" />
          <Stat value="即日" label="最短導入期間" />
          <Stat value="99.9%" label="サービス稼働率" />
        </div>
      </section>

      {/* ===== 運営フロー ===== */}
      <section id="flow" className="bg-white py-12 border-t border-border-light">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-accent mb-2 uppercase tracking-wider">Operation Flow</p>
            <h2 className="text-[22px] font-bold text-text-primary mb-1">1日の運営がそのままシステムに</h2>
            <p className="text-[14px] text-text-secondary">開店から締めまで、業務の流れに沿って自然に操作できます</p>
          </div>
          <div className="relative">
            <div className="absolute left-[18px] top-5 bottom-5 w-px bg-border-light" />
            {[
              { icon: <DoorOpen />, title: "入店登録",
                desc: "来店した顧客をワンタップで登録。LINEのQRコードからの来店にも対応しています。VIPや常連のお客様はランクバッジで自動識別され、過去の来店履歴やチップ残高がその場で確認可能です。登録された顧客は「未配置」として入店管理画面に表示され、そのまま卓配置の操作へスムーズにつながります。新規顧客もその場でフォーム登録でき、名前・電話番号・ランクを入力するだけで完了します。" },
              { icon: <Grid3X3 />, title: "卓に配置",
                desc: "トナメ・リング・サイドの卓種別ごとにポーカーテーブルをビジュアル表示。顧客をドラッグ＆ドロップで好きな卓の好きな席に配置できます。各卓の空席数、着席中のプレイヤー、ディーラーの名前と配置時間がリアルタイムで把握でき、ディーラー交代のタイミング管理にも対応。卓の追加・編集・削除もその場で完結し、プレイヤーが配置されている卓を削除する際は確認ダイアログで安全に操作できます。" },
              { icon: <ShoppingBag />, title: "注文・提供",
                desc: "商品マスタに登録されたドリンク・フード・チップをタップで注文。注文は来店情報と自動的に紐付けられ、顧客ごとの利用金額がリアルタイムで更新されます。注文履歴は行をクリックするとインライン展開で確認でき、追加注文もその場でモーダルから完了。商品の価格はサーバー側で検証されるため、フロント改ざんによる不正も防止されます。カテゴリ別のフィルタリングにも対応しています。" },
              { icon: <CreditCard />, title: "精算",
                desc: "現金・カード・電子マネーの支払方法に対応。来店中の顧客一覧から精算対象を選び、支払方法を選択するだけで精算が完了します。精算済みのステータスは即座に画面に反映され、ダッシュボードの未精算カウントもリアルタイムで減少。同一来店の二重精算はシステムが自動ブロックするため、オペレーションミスを根本から防止します。精算履歴は監査ログにも自動記録されます。" },
              { icon: <ClipboardCheck />, title: "締め処理",
                desc: "当日の売上・注文・精算データをシステムが自動集計。現金・カード・電子マネーの支払方法別内訳が一覧表示され、未精算の有無もワンクリックで確認できます。未精算の顧客が残っている場合は警告が表示され、締め処理の前に対応を促します。メモを添えて「締め実行」ボタンを押すだけで日次の売上が確定し、同一日の二重締めはユニーク制約で防止。締め履歴は全て保存され、後日の確認や月次分析にも活用できます。" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-4 mb-6 last:mb-0 relative">
                <div className="w-[36px] h-[36px] rounded-full bg-accent text-white flex items-center justify-center text-[14px] font-bold flex-shrink-0 z-10">
                  {i + 1}
                </div>
                <div className="pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-accent [&>svg]:w-5 [&>svg]:h-5">{s.icon}</span>
                    <span className="text-[16px] font-semibold text-text-primary">{s.title}</span>
                  </div>
                  <p className="text-[14px] text-text-secondary leading-[1.8]">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Before → After（詳細版） ===== */}
      <section id="problem" className="py-12 border-t border-border-light">
        <div className="w-full px-8 md:px-16">
          <div className="text-center mb-10">
            <p className="text-[12px] font-medium text-accent mb-2 uppercase tracking-wider">Before → After</p>
            <h2 className="text-[20px] font-bold text-text-primary">こんな課題を、こう解決します</h2>
          </div>

          <div className="space-y-12">
            {[
              {
                beforeImg: "/illustrations/before-checkin.png", afterImg: "/illustrations/after-checkin.png",
                problem: "入退店の記録が追いつかない",
                problemDesc: "来店した顧客を紙の名簿に手書きで記録していませんか？混雑する時間帯には記入漏れが頻発し、「今、店内に何人いるのか」すら正確に把握できない状態に。Excelで後から集計しようにも、営業中にPCを開く余裕はなく、結局翌日にまとめて入力する日々が続いてしまいます。来店状況の把握が遅れることで、適切なスタッフ配置や卓の割り当ても後手に回ってしまいます。",
                solution: "リアルタイムタイムラインですべてを即座に把握",
                solutionDesc: "顧客が入店した瞬間にシステムへ自動記録されます。店内にいる顧客の数、まだ卓に配置されていない人数、精算がまだ済んでいない件数がリアルタイムで画面に表示。誰がいつ来店し、どの卓に座っていて、現在いくら利用しているかが一目でわかります。タイムラインには出退勤やイベント開始も含まれるため、店舗全体の動きを時系列で把握できます。",
              },
              {
                beforeImg: "/illustrations/before-table.png", afterImg: "/illustrations/after-table.png",
                problem: "卓の配置に手間取ってお客様を待たせてしまう",
                problemDesc: "どの卓が空いているのか確認するために、フロアを歩き回って目視で確認していませんか？ディーラーの配置状況も口頭で聞かないとわからない。ピーク時にはどの卓が満席でどこに空きがあるのか把握しきれず、VIPのお客様を長時間お待たせしてしまうことも。卓の種別（トナメ・リング・サイド）ごとの管理も、ホワイトボードや紙ベースでは限界があります。",
                solution: "ビジュアル卓管理でドラッグ＆ドロップ配置",
                solutionDesc: "画面上にポーカーテーブルをそのまま再現。各卓の空席状況が色分けで一目瞭然です。顧客をドラッグして好きな卓の好きな席に配置するだけ。トナメ・リング・サイドの卓種別はもちろん、ディーラーの配置時間も自動で記録されるため、交代タイミングの管理も簡単です。卓の追加・編集・削除もその場で完了します。",
              },
              {
                beforeImg: "/illustrations/before-chip.png", afterImg: "/illustrations/after-chip.png",
                problem: "チップの残高が合わない、トラブルの原因に",
                problemDesc: "チップの付与や使用をその場で手書きメモに記録しているけれど、後から集計するとお客様の認識と店舗の記録が一致しない。「1,000枚もらったはず」「いや記録にはないです」という水掛け論になり、お客様の信頼を損なうことも。特にVIPのお客様とのトラブルは店舗の評判に直結します。ポイントの管理も別の台帳で行っていると、さらに混乱が増します。",
                solution: "履歴ベースの残高管理で整合性を完全に担保",
                solutionDesc: "チップの増減はすべて操作の瞬間に履歴として記録されます。残高は履歴の合計から自動計算されるため、手入力による不一致が構造的に発生しません。いつ・誰が・いくら・どんな理由で操作したかを完全に追跡可能。ポイントも同じ仕組みで管理され、来店時の自動付与にも対応しています。",
              },
              {
                beforeImg: "/illustrations/before-shift.png", afterImg: "/illustrations/after-shift.png",
                problem: "シフト作成と勤怠管理がバラバラで二度手間",
                problemDesc: "シフトの希望をLINEグループで集め、Excelで表に起こして調整。勤怠はタイムカードで打刻し、月末に電卓を叩いて勤務時間を計算して給与に反映する。修正が入るたびにLINEでやり取りが発生し、管理者の業務時間がどんどん膨らんでいく。シフトと実際の出退勤が連動していないため、「シフトに入っているのに来ていない」状況の把握も遅れがちです。",
                solution: "タイムラインUIでシフトを直感作成、LINEで出退勤打刻",
                solutionDesc: "シフトはタイムラインUI上でバーをドラッグするだけで直感的に作成できます。15分単位での細かい調整や、休憩時間の設定もドラッグ操作で完了。スタッフはLINEからワンタップで出退勤を打刻でき、勤務時間は分単位・秒切り捨てで自動計算されます。勤怠の修正には承認フローが付くため、不正な変更も防止。シフト表はPDF出力にも対応しています。",
              },
              {
                beforeImg: "/illustrations/before-closing.png", afterImg: "/illustrations/after-closing.png",
                problem: "毎晩の締め作業に1時間以上かかっている",
                problemDesc: "営業終了後、レジの現金を数え、カード端末の売上と照合し、差異があれば伝票を1枚ずつめくって原因を探す。売上の内訳を支払方法別に手計算でまとめ、ノートに記録する。未精算のお客様がいないかの確認も人の記憶頼み。この作業に毎晩1時間以上費やしており、閉店後のスタッフの負担が深刻な問題になっています。",
                solution: "ワンクリックで締め処理完了、差異も自動検知",
                solutionDesc: "当日の注文データ・精算データからシステムが売上を自動集計します。現金・カード・電子マネーの支払方法別内訳、未精算の有無もワンクリックで確認可能。レジ差異が発生した場合はシステムが自動検知してアラートを表示します。メモを添えて「締め実行」ボタンを押すだけで、日次の締め処理が完了。履歴として保存されるため、後日の確認や分析にも活用できます。",
              },
            ].map((item, i) => (
              <div key={i} className="pb-12 border-b border-border-light last:border-0 last:pb-0">
                {/* Before: 文章（左）+ 画像（右） */}
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="md:w-[60%]">
                    <p className="text-[11px] font-semibold text-status-danger uppercase tracking-wider mb-2">Before</p>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Minus className="w-3.5 h-3.5 text-status-danger flex-shrink-0" />
                      <h3 className="text-[17px] font-semibold text-status-danger">{item.problem}</h3>
                    </div>
                    <p className="text-[14px] text-text-secondary leading-[1.8]">{item.problemDesc}</p>
                  </div>
                  <div className="md:w-[40%] flex justify-center">
                    <Image src={item.beforeImg} alt={item.problem} width={240} height={240} className="object-contain" />
                  </div>
                </div>

                {/* 中央下矢印 */}
                <div className="flex justify-center py-4">
                  <div className="w-8 h-8 rounded-full bg-border-light flex items-center justify-center">
                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                  </div>
                </div>

                {/* After: 画像（左）+ 文章（右） */}
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="md:w-[40%] flex justify-center">
                    <Image src={item.afterImg} alt={item.solution} width={240} height={240} className="object-contain" />
                  </div>
                  <div className="md:w-[60%]">
                    <p className="text-[11px] font-semibold text-accent uppercase tracking-wider mb-2">After</p>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Check className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                      <h3 className="text-[17px] font-semibold text-accent">{item.solution}</h3>
                    </div>
                    <p className="text-[14px] text-text-primary leading-[1.8]">{item.solutionDesc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 中間CTA ===== */}
      <section className="py-10 border-t border-border-light bg-[#f0f9f6]">
        <div className="text-center">
          <h3 className="t-heading mb-2">まずは無料で触ってみてください</h3>
          <p className="text-[12px] text-text-secondary mb-4">アカウント登録不要。デモモードで全機能をお試しいただけます</p>
          <button onClick={handleDemo} className="group inline-flex items-center gap-2 px-6 py-2.5 text-[14px] font-medium bg-accent text-white rounded-[6px] hover:bg-accent-hover">
            デモを体験する<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* (運営フローは数字セクションの後に移動済み) */}

      {/* ===== 機能（縦1列） ===== */}
      <section id="features" className="py-14 border-t border-border-light">
        <div className="w-full px-8 md:px-16 mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-accent mb-2 uppercase tracking-wider">Features</p>
            <h2 className="text-[20px] font-bold text-text-primary mb-1">店舗運営に必要な機能をすべて搭載</h2>
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
              <div key={i} className="flex items-start gap-3 py-4 border-b border-border-light">
                <div className="w-8 h-8 rounded-[6px] bg-accent-light flex items-center justify-center flex-shrink-0 text-accent [&>svg]:w-4 [&>svg]:h-4 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <h3 className="t-heading mb-0.5">{f.title}</h3>
                  <p className="text-[13px] text-text-secondary leading-[1.7]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 導入メリット（縦1列） ===== */}
      <section id="merit" className="bg-white py-14 border-t border-border-light">
        <div className="w-full px-8 md:px-16 mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-accent mb-2 uppercase tracking-wider">Benefits</p>
            <h2 className="text-[20px] font-bold text-text-primary">導入するメリット</h2>
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
              <div key={i} className="flex items-start gap-3 py-4 border-b border-border-light">
                <div className="w-8 h-8 rounded-[6px] bg-accent-light flex items-center justify-center flex-shrink-0 text-accent [&>svg]:w-4 [&>svg]:h-4 mt-0.5">
                  {b.icon}
                </div>
                <div>
                  <h3 className="t-heading mb-0.5">{b.title}</h3>
                  <p className="text-[13px] text-text-secondary leading-[1.7]">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== LINE連携（2カラム・バランス調整） ===== */}
      <section className="py-14 border-t border-border-light">
        <div className="w-full px-8 md:px-16 mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-[55%]">
              <p className="text-[12px] font-medium text-accent mb-2 uppercase tracking-wider">LINE Integration</p>
              <h2 className="text-[20px] font-bold text-text-primary mb-3">LINEから、すべてが動く</h2>
              <p className="text-[13px] text-text-secondary leading-[1.8] mb-5">
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
                    <div className="w-7 h-7 rounded-[6px] bg-accent-light flex items-center justify-center flex-shrink-0 text-accent [&>svg]:w-3.5 [&>svg]:h-3.5">{l.icon}</div>
                    <div>
                      <span className="text-[12px] font-semibold text-text-primary">{l.role}</span>
                      <p className="text-[12px] text-text-secondary">{l.items}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-[45%] flex justify-center">
              <div className="bg-white border border-border-light rounded-[16px] p-5 w-[260px] shadow-sm">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-light">
                  <Image src="/logo-icon.png" alt="みえるくん" width={22} height={22} />
                  <span className="text-[13px] font-bold text-text-primary">てんぽみえるくん</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "出退勤", sub: "打刻・履歴確認" },
                    { label: "卓確認", sub: "稼働状況を確認" },
                    { label: "チップ付与", sub: "顧客にチップを付与" },
                    { label: "来店登録", sub: "QRコードで入店" },
                  ].map((item, i) => (
                    <div key={i} className="bg-bg-hover border border-border-light rounded-[8px] px-3 py-2.5 flex items-center justify-between hover:bg-bg-hover cursor-pointer transition-colors">
                      <div>
                        <p className="text-[12px] font-medium text-text-primary">{item.label}</p>
                        <p className="text-[10px] text-text-tertiary">{item.sub}</p>
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
      <section className="bg-white py-14 border-t border-border-light">
        <div className="w-full px-8 md:px-16 mx-auto max-w-6xl text-center">
          <p className="text-[12px] font-medium text-accent mb-2 uppercase tracking-wider">Getting Started</p>
          <h2 className="text-[20px] font-bold text-text-primary mb-8">3ステップで始められます</h2>
          <div className="grid grid-cols-3 gap-6">
            {[
              { n: "1", t: "デモで体験", d: "アカウント不要。今すぐ全機能をお試しください。" },
              { n: "2", t: "プランを選択", d: "店舗の規模に合わせて最適なプランを。" },
              { n: "3", t: "即日スタート", d: "初期設定は最短30分。その日から運用開始。" },
            ].map((s, i) => (
              <div key={i}>
                <div className="w-10 h-10 rounded-full border-2 border-accent text-accent flex items-center justify-center text-[16px] font-bold mx-auto mb-2">{s.n}</div>
                <h3 className="t-subhead mb-1">{s.t}</h3>
                <p className="text-[11px] text-text-secondary">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 料金 ===== */}
      <section id="pricing" className="py-14 border-t border-border-light">
        <div className="w-full px-8 md:px-16 mx-auto">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-accent mb-2 uppercase tracking-wider">Pricing</p>
            <h2 className="text-[20px] font-bold text-text-primary mb-1">シンプルな料金体系</h2>
            <p className="text-[13px] text-text-secondary">初期費用0円。必要な分だけお支払い</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <PricePlan name="スターター" price="¥9,800" unit="/月" desc="1店舗・5名まで" features={["入退店・卓管理", "注文・精算", "顧客管理", "ダッシュボード", "LINE連携（スタッフ）"]} />
            <PricePlan name="スタンダード" price="¥19,800" unit="/月" desc="1店舗・15名まで" features={["スターターの全機能", "チップ・ポイント管理", "勤怠・シフト管理", "締め処理・履歴", "PDF出力", "LINE連携（顧客）"]} highlight />
            <PricePlan name="プレミアム" price="¥39,800" unit="/月" desc="多店舗・無制限" features={["スタンダードの全機能", "多店舗対応", "経営分析・レポート", "API連携", "優先サポート"]} />
          </div>
          <p className="text-center text-[11px] text-text-tertiary mt-5">※ 全プラン初期費用0円。年払いで2ヶ月分無料。</p>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section id="faq" className="bg-white py-14 border-t border-border-light">
        <div className="w-full px-8 md:px-16 mx-auto max-w-6xl">
          <div className="text-center mb-8">
            <p className="text-[12px] font-medium text-accent mb-2 uppercase tracking-wider">FAQ</p>
            <h2 className="text-[20px] font-bold text-text-primary">よくある質問</h2>
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
      <section className="bg-text-primary py-14">
        <div className="text-center">
          <Image src="/logo-icon.png" alt="みえるくん" width={44} height={44} className="mx-auto mb-3" />
          <h3 className="text-[18px] font-bold text-white mb-2">まずは無料で触ってみてください</h3>
          <p className="text-[13px] text-white/50 mb-6">アカウント登録不要。デモモードで全機能をお試しいただけます</p>
          <button onClick={handleDemo} className="group inline-flex items-center gap-2 px-7 py-2.5 text-[14px] font-medium bg-accent text-white rounded-[6px] hover:bg-accent-hover">
            デモを体験する<ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="bg-white border-t border-border-light py-6">
        <div className="w-full px-8 md:px-16 flex items-center justify-center gap-2">
          <Image src="/logo-icon.png" alt="みえるくん" width={24} height={24} />
          <span className="text-[13px] text-text-tertiary">&copy; {new Date().getFullYear()} てんぽみえるくん</span>
        </div>
      </footer>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div><p className="text-[32px] font-medium text-accent tracking-tight leading-none">{value}</p><p className="text-[13px] text-text-secondary mt-1.5">{label}</p></div>;
}

function FAQ({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-light">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-3.5 text-left">
        <span className="text-[14px] font-medium text-text-primary">{q}</span>
        <ChevronDown className={`w-4 h-4 text-text-tertiary flex-shrink-0 ml-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="text-[13px] text-text-secondary leading-[1.7] pb-3.5">{a}</p>}
    </div>
  );
}

function PricePlan({ name, price, unit, desc, features, highlight }: {
  name: string; price: string; unit: string; desc: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div className={`rounded-[8px] p-5 ${highlight ? "border-2 border-accent bg-[#f0f9f6]" : "border border-border-light bg-white"}`}>
      {highlight && <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">おすすめ</span>}
      <h3 className="text-[15px] font-bold text-text-primary mt-1">{name}</h3>
      <div className="flex items-baseline gap-0.5 mt-2 mb-1">
        <span className="text-[26px] font-black text-text-primary">{price}</span>
        <span className="text-[11px] text-text-tertiary">{unit}</span>
      </div>
      <p className="text-[11px] text-text-tertiary mb-3">{desc}</p>
      <div className="space-y-1.5">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <Check className="w-3 h-3 text-accent flex-shrink-0" />{f}
          </div>
        ))}
      </div>
    </div>
  );
}
