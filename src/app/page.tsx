"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight, ArrowUpRight, Check, X, MessageCircle,
  DoorOpen, Grid3X3, ShoppingBag, Coins, Users, Clock,
  BarChart3, Smartphone, Zap, ShieldCheck, Sparkles, Network,
} from "lucide-react";

export default function Home() {
  const heroRef = useRef<HTMLDivElement>(null);
  const [headerActive, setHeaderActive] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactHidden, setContactHidden] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // ヒーローを過ぎたかどうかの判定
  useEffect(() => {
    function onScroll() {
      const hero = heroRef.current;
      if (!hero) return;
      const heroBottom = hero.offsetTop + hero.offsetHeight;
      setHeaderActive(window.scrollY > heroBottom - 80);
      setScrollProgress(window.scrollY);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // contact: 一定スクロールしたら表示
  useEffect(() => {
    if (contactHidden) return;
    if (scrollProgress > 300) setContactOpen(true);
  }, [scrollProgress, contactHidden]);

  function handleDemo() {
    document.cookie = "demo_mode=true; path=/; max-age=86400; SameSite=Lax";
    window.location.href = "/v2";
  }

  return (
    <div className="lp">
      {/* ===== HEADER (Hero段階: 通常スクロール / Hero通過後: sticky transparent) ===== */}
      <header className={`lp-header ${headerActive ? "is-active" : ""}`}>
        <div className="lp-header__inner">
          <Link href="#top" className="lp-header__brand">
            <Image src="/logo-icon.png" alt="てんぽみえるくん" width={32} height={32} priority />
            <span>てんぽみえるくん</span>
          </Link>
          <nav className="lp-header__nav">
            <a href="#vision">VISION</a>
            <a href="#services">SERVICES</a>
            <a href="#capabilities">CAPABILITIES</a>
            <a href="#contact">CONTACT</a>
          </nav>
          <button onClick={handleDemo} className="lp-header__cta">
            デモを見る <ArrowRight size={14} />
          </button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <section id="top" ref={heroRef} className="lp-hero">
        <div className="lp-hero__bg" />
        <div className="lp-hero__shapes">
          <div className="lp-shape lp-shape--a" />
          <div className="lp-shape lp-shape--b" />
          <div className="lp-shape lp-shape--c" />
        </div>

        <div className="lp-hero__inner">
          <p className="lp-eyebrow">Amusement Casino · Operation System</p>
          <h1 className="lp-hero__title">
            店舗運営を、<br />
            <span className="lp-hero__accent">ひとつの画面に。</span>
          </h1>
          <p className="lp-hero__lead">
            入退店・卓・注文・チップ・勤怠・在庫・販促。<br />
            アミューズメントカジノの現場を、徹底的に見えるくする。
          </p>
          <div className="lp-hero__actions">
            <button onClick={handleDemo} className="lp-btn lp-btn--primary">
              無料でデモを試す <ArrowRight size={16} />
            </button>
            <a href="#vision" className="lp-btn lp-btn--ghost">
              詳しく見る
            </a>
          </div>
          <div className="lp-hero__meta">
            <span><Check size={12} /> 初期費用0円</span>
            <span><Check size={12} /> 最短即日導入</span>
            <span><Check size={12} /> LINE連携対応</span>
          </div>
        </div>

        <div className="lp-hero__scroll">
          <span>SCROLL</span>
          <div className="lp-hero__scroll-line" />
        </div>
      </section>

      {/* ===== VISION ===== */}
      <BigSection
        id="vision"
        label="01 / VISION"
        title={<>店舗運営の<br />“見えない”を<br />全部、見える化。</>}
        lead="紙の名簿、ホワイトボード、Excelの売上集計、LINEでの勤怠連絡。バラバラに散らばっている情報を一つに統合し、店長もスタッフもお客様も、同じ景色を見て働ける環境を作ります。"
        side={
          <div className="lp-vision-card">
            <div className="lp-vision-card__row">
              <Sparkles size={20} />
              <div>
                <strong>毎日見たくなる経営画面</strong>
                <p>本日売上・来店中・予約・在庫不足が一目で。</p>
              </div>
            </div>
            <div className="lp-vision-card__row">
              <Network size={20} />
              <div>
                <strong>すべてが連動する</strong>
                <p>入店→卓→注文→精算→売上→顧客履歴が自動連鎖。</p>
              </div>
            </div>
            <div className="lp-vision-card__row">
              <Smartphone size={20} />
              <div>
                <strong>LINEがそのまま店内端末</strong>
                <p>専用アプリ不要。お客様もスタッフもLINEで完結。</p>
              </div>
            </div>
          </div>
        }
      />

      {/* ===== SERVICES ===== */}
      <BigSection
        id="services"
        label="02 / SERVICES"
        title={<>運営に必要な<br />8領域を一画面に。</>}
        lead="一つひとつの業務がバラバラなツールに分かれている時代は終わり。日々の運営に必要な機能を、必要な順序で、無駄なく揃えました。"
        side={
          <div className="lp-grid">
            {[
              { icon: DoorOpen, t: "入店管理", d: "QR/手動チェックイン" },
              { icon: Grid3X3, t: "卓管理", d: "ドラッグで席配置" },
              { icon: ShoppingBag, t: "注文/精算", d: "現金/カード/QR" },
              { icon: Coins, t: "チップフロー", d: "獲得/使用ルート可視化" },
              { icon: Users, t: "顧客", d: "ランク・履歴・ポイント" },
              { icon: Clock, t: "勤怠/シフト", d: "LINE打刻" },
              { icon: BarChart3, t: "売上/レポート", d: "PDF出力対応" },
              { icon: ShieldCheck, t: "在庫管理", d: "閾値で発注アラート" },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.t} className="lp-grid__cell">
                  <Icon size={20} />
                  <strong>{s.t}</strong>
                  <span>{s.d}</span>
                </div>
              );
            })}
          </div>
        }
      />

      {/* ===== CAPABILITIES ===== */}
      <BigSection
        id="capabilities"
        label="03 / CAPABILITIES"
        title={<>“現場で動く”<br />ための設計思想。</>}
        lead="営業中の混雑を捌ける速度、深夜の締めを助ける自動化、スタッフが直感で扱えるUI。お店の現実から逆算して、本当に使えるシステムにしました。"
        side={
          <ul className="lp-cap">
            <li>
              <Zap size={18} />
              <div>
                <strong>リアルタイム同期</strong>
                <p>注文/呼び出しがフロアの端末に瞬時に届く。お客様を待たせない。</p>
              </div>
            </li>
            <li>
              <BarChart3 size={18} />
              <div>
                <strong>PDFレポート出力</strong>
                <p>日次/月次の売上、勤怠タイムカード、領収書、在庫リスト。ワンクリックで印刷可能。</p>
              </div>
            </li>
            <li>
              <ShieldCheck size={18} />
              <div>
                <strong>権限・セキュリティ</strong>
                <p>役職ごとのアクセス制御、監査ログ、データバックアップ。</p>
              </div>
            </li>
            <li>
              <Sparkles size={18} />
              <div>
                <strong>カスタマイズ自由</strong>
                <p>ランク・チップ単位・ポイントルール・料金プラン。お店の運用ルールをそのまま反映。</p>
              </div>
            </li>
          </ul>
        }
      />

      {/* ===== 無料相談フォーム (下部) ===== */}
      <section id="form" className="lp-form-section">
        <div className="lp-form-section__inner">
          <p className="lp-eyebrow lp-eyebrow--dark">無料相談フォーム</p>
          <h2 className="lp-form-section__title">店舗の運営、まずは相談から。</h2>
          <p className="lp-form-section__lead">
            導入の進め方、機能の質問、価格感のすり合わせ。
            営業担当者ではなく開発者が直接お伺いします。
          </p>

          <form className="lp-form" onSubmit={(e) => { e.preventDefault(); alert("送信しました(デモ)"); }}>
            <div className="lp-form__row">
              <label>
                <span>お名前 *</span>
                <input type="text" required placeholder="山田 太郎" />
              </label>
              <label>
                <span>店舗名</span>
                <input type="text" placeholder="◯◯カジノ" />
              </label>
            </div>
            <div className="lp-form__row">
              <label>
                <span>メールアドレス *</span>
                <input type="email" required placeholder="example@store.com" />
              </label>
              <label>
                <span>電話番号</span>
                <input type="tel" placeholder="090-0000-0000" />
              </label>
            </div>
            <label>
              <span>ご相談内容</span>
              <textarea rows={4} placeholder="導入をご検討中のシステム/機能/規模感などをお書きください" />
            </label>
            <div className="lp-form__submit">
              <button type="submit" className="lp-btn lp-btn--primary lp-btn--lg">
                送信する <ArrowRight size={16} />
              </button>
              <p className="lp-form__note">通常2営業日以内にご返信いたします</p>
            </div>
          </form>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <div className="lp-footer__brand">
            <Image src="/logo-icon.png" alt="てんぽみえるくん" width={28} height={28} />
            <span>てんぽみえるくん</span>
          </div>
          <div className="lp-footer__copy">© {new Date().getFullYear()} Mieru-kun. All rights reserved.</div>
        </div>
      </footer>

      {/* ===== 浮動 CONTACT (常時表示 / 一度閉じたら出ない) ===== */}
      {!contactHidden && (
        <div id="contact" className={`lp-contact ${contactOpen ? "is-open" : ""}`}>
          {contactOpen ? (
            <div className="lp-contact__card">
              <div className="lp-contact__head">
                <MessageCircle size={16} />
                <strong>お問い合わせ</strong>
                <button
                  onClick={() => setContactHidden(true)}
                  className="lp-contact__close"
                  aria-label="閉じる"
                >
                  <X size={14} />
                </button>
              </div>
              <p>気になる機能や導入のご質問、お気軽にどうぞ。</p>
              <div className="lp-contact__actions">
                <a href="#form" className="lp-btn lp-btn--primary lp-btn--sm" onClick={() => setContactOpen(false)}>
                  相談する <ArrowUpRight size={12} />
                </a>
                <button onClick={() => setContactOpen(false)} className="lp-btn lp-btn--sm">
                  あとで
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setContactOpen(true)} className="lp-contact__bubble" aria-label="お問い合わせ">
              <MessageCircle size={20} />
            </button>
          )}
        </div>
      )}

      <style jsx global>{`
        /* ============== LP global ============== */
        .lp {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Helvetica Neue", "Hiragino Sans", "Yu Gothic UI", system-ui, sans-serif;
          color: #18221d;
          background: #f4f8f5;
          font-feature-settings: "palt";
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }
        .lp a { color: inherit; text-decoration: none; }
        .lp button { font: inherit; cursor: pointer; }

        /* ============== HEADER ============== */
        .lp-header {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 50;
          background: transparent;
          transition: background 0.25s ease, backdrop-filter 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;
        }
        .lp-header.is-active {
          position: fixed;
          background: rgba(255, 255, 255, 0.78);
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          box-shadow: 0 1px 0 rgba(28,46,36,0.06);
          animation: lp-header-in 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        @keyframes lp-header-in {
          from { transform: translateY(-100%); }
          to   { transform: translateY(0); }
        }
        .lp-header__inner {
          max-width: 1280px; margin: 0 auto;
          padding: 18px 32px;
          display: flex; align-items: center; gap: 32px;
        }
        .lp-header__brand {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 15px; font-weight: 700; letter-spacing: 0.01em;
          color: #fff;
          transition: color 0.25s;
        }
        .lp-header.is-active .lp-header__brand { color: #18221d; }
        .lp-header__brand img { background: transparent; }
        .lp-header__nav {
          display: none; gap: 28px;
          margin-left: auto;
          font-size: 12px; font-weight: 600;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.85);
          transition: color 0.25s;
        }
        .lp-header.is-active .lp-header__nav { color: #4a5961; }
        .lp-header__nav a:hover { color: inherit; opacity: 0.7; }
        @media (min-width: 880px) { .lp-header__nav { display: inline-flex; } }
        .lp-header__cta {
          margin-left: auto;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 9px 16px;
          font-size: 13px; font-weight: 600;
          border-radius: 999px;
          background: #ffffff;
          color: #18221d;
          border: 0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        @media (min-width: 880px) { .lp-header__cta { margin-left: 0; } }
        .lp-header__cta:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.18); }
        .lp-header.is-active .lp-header__cta {
          background: #18221d; color: #fff;
        }

        /* ============== HERO ============== */
        .lp-hero {
          position: relative;
          min-height: 100vh;
          padding: 140px 32px 96px;
          overflow: hidden;
          color: #fff;
          background: linear-gradient(135deg, #0f3b2a 0%, #1d6e4a 40%, #1f8d5f 80%, #2da76e 100%);
        }
        .lp-hero__bg {
          position: absolute; inset: 0;
          background:
            radial-gradient(800px 500px at 80% 20%, rgba(255,255,255,0.10), transparent 60%),
            radial-gradient(600px 400px at 20% 90%, rgba(255,255,255,0.08), transparent 60%);
          pointer-events: none;
        }
        .lp-hero__shapes { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .lp-shape {
          position: absolute; border-radius: 50%;
          filter: blur(60px); opacity: 0.55;
          animation: lp-float 16s ease-in-out infinite;
        }
        .lp-shape--a { width: 380px; height: 380px; top: -80px; right: -60px;  background: #6fe0ad; }
        .lp-shape--b { width: 320px; height: 320px; bottom: -120px; left: 10%;   background: #145e3f; animation-delay: -5s; }
        .lp-shape--c { width: 240px; height: 240px; top: 40%; left: -80px;      background: #9af2c5; animation-delay: -10s; }
        @keyframes lp-float {
          0%, 100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(40px,-30px) scale(1.08); }
        }

        .lp-hero__inner {
          position: relative;
          max-width: 1100px; margin: 0 auto;
          z-index: 1;
        }
        .lp-eyebrow {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          opacity: 0.85;
          margin-bottom: 24px;
        }
        .lp-eyebrow--dark { color: #2da76e; opacity: 1; }
        .lp-hero__title {
          font-size: clamp(40px, 7vw, 80px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.02em;
          margin: 0 0 24px;
        }
        .lp-hero__accent {
          background: linear-gradient(90deg, #fff 0%, #aef5d4 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .lp-hero__lead {
          font-size: clamp(15px, 1.5vw, 18px);
          line-height: 1.85;
          opacity: 0.9;
          max-width: 560px;
          margin: 0 0 36px;
        }
        .lp-hero__actions { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 32px; }
        .lp-hero__meta {
          display: flex; gap: 20px; flex-wrap: wrap;
          font-size: 12px;
          opacity: 0.8;
        }
        .lp-hero__meta span { display: inline-flex; align-items: center; gap: 4px; }

        .lp-hero__scroll {
          position: absolute; bottom: 24px; left: 50%;
          transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          font-size: 10px; letter-spacing: 0.3em; opacity: 0.6;
        }
        .lp-hero__scroll-line {
          width: 1px; height: 40px;
          background: linear-gradient(to bottom, currentColor, transparent);
          animation: lp-scroll-fade 1.8s ease-in-out infinite;
        }
        @keyframes lp-scroll-fade {
          0%, 100% { opacity: 0.2; transform: scaleY(1); }
          50%      { opacity: 1;   transform: scaleY(1.3); transform-origin: top; }
        }

        /* ============== BUTTONS ============== */
        .lp-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 12px 22px;
          font-size: 14px; font-weight: 600;
          border-radius: 999px;
          border: 1px solid transparent;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
        }
        .lp-btn--sm { padding: 8px 14px; font-size: 12px; }
        .lp-btn--lg { padding: 16px 28px; font-size: 15px; }
        .lp-btn--primary {
          background: #18221d; color: #fff;
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
        }
        .lp-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 8px 22px rgba(0,0,0,0.22); }
        .lp-btn--ghost {
          background: rgba(255,255,255,0.12); color: #fff;
          border-color: rgba(255,255,255,0.32);
          backdrop-filter: blur(4px);
        }
        .lp-btn--ghost:hover { background: rgba(255,255,255,0.2); }

        /* ============== BIG SECTION ============== */
        .lp-big {
          padding: 140px 32px;
          background: #fff;
          position: relative;
        }
        .lp-big + .lp-big { background: #f4f8f5; }
        .lp-big__inner {
          max-width: 1280px; margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 56px;
          align-items: start;
        }
        @media (min-width: 980px) {
          .lp-big__inner { grid-template-columns: 1fr 1fr; gap: 80px; }
        }
        .lp-big__lead {
          opacity: 0; transform: translateY(40px);
          transition: opacity 0.7s ease, transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .lp-big.is-visible .lp-big__lead { opacity: 1; transform: translateY(0); }
        .lp-big__side {
          opacity: 0; transform: translateY(40px);
          transition: opacity 0.7s ease 0.15s, transform 0.7s cubic-bezier(0.22, 0.61, 0.36, 1) 0.15s;
        }
        .lp-big.is-visible .lp-big__side { opacity: 1; transform: translateY(0); }

        .lp-big__label {
          font-size: 11px; font-weight: 700;
          letter-spacing: 0.22em;
          color: #2da76e;
          margin-bottom: 24px;
        }
        .lp-big__title {
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 800;
          line-height: 1.08;
          letter-spacing: -0.02em;
          margin: 0 0 28px;
        }
        .lp-big__desc {
          font-size: 15px; line-height: 1.95;
          color: #4a5961; max-width: 480px;
        }

        /* VISION card */
        .lp-vision-card {
          background: linear-gradient(135deg, #ffffff 0%, #f0f8f3 100%);
          border-radius: 24px;
          padding: 32px;
          border: 1px solid rgba(45,167,110,0.18);
          box-shadow: 0 12px 40px rgba(28,46,36,0.06);
          display: grid; gap: 24px;
        }
        .lp-vision-card__row { display: flex; gap: 16px; align-items: flex-start; }
        .lp-vision-card__row > svg {
          flex-shrink: 0;
          color: #2da76e;
          padding: 10px;
          width: 40px; height: 40px;
          background: rgba(45,167,110,0.10);
          border-radius: 10px;
          box-sizing: content-box;
        }
        .lp-vision-card__row strong { display: block; font-size: 15px; font-weight: 700; margin-bottom: 4px; }
        .lp-vision-card__row p { font-size: 13px; color: #4a5961; line-height: 1.7; margin: 0; }

        /* SERVICES grid */
        .lp-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .lp-grid__cell {
          padding: 22px 20px;
          border-radius: 16px;
          background: #fff;
          border: 1px solid rgba(28,46,36,0.06);
          box-shadow: 0 4px 16px rgba(28,46,36,0.04);
          transition: transform 0.25s, box-shadow 0.25s;
        }
        .lp-grid__cell:hover { transform: translateY(-4px); box-shadow: 0 12px 28px rgba(28,46,36,0.08); }
        .lp-grid__cell > svg {
          color: #2da76e;
          margin-bottom: 12px;
        }
        .lp-grid__cell strong { display: block; font-size: 14px; font-weight: 700; margin-bottom: 4px; }
        .lp-grid__cell span { font-size: 12px; color: #4a5961; }

        /* CAPABILITIES list */
        .lp-cap { list-style: none; padding: 0; margin: 0; display: grid; gap: 28px; }
        .lp-cap li {
          display: flex; gap: 18px; align-items: flex-start;
          padding-bottom: 28px;
          border-bottom: 1px solid rgba(28,46,36,0.08);
        }
        .lp-cap li:last-child { border-bottom: 0; padding-bottom: 0; }
        .lp-cap li > svg {
          flex-shrink: 0;
          color: #2da76e;
          padding: 9px;
          background: rgba(45,167,110,0.10);
          border-radius: 8px;
          width: 36px; height: 36px;
          box-sizing: content-box;
        }
        .lp-cap strong { display: block; font-size: 16px; font-weight: 700; margin-bottom: 6px; }
        .lp-cap p { font-size: 13.5px; line-height: 1.85; color: #4a5961; margin: 0; }

        /* ============== FORM SECTION (下部) ============== */
        .lp-form-section {
          padding: 140px 32px;
          background: linear-gradient(180deg, #f4f8f5 0%, #e8f2ec 100%);
        }
        .lp-form-section__inner { max-width: 760px; margin: 0 auto; }
        .lp-form-section__title {
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          line-height: 1.2;
          letter-spacing: -0.02em;
          margin: 0 0 16px;
        }
        .lp-form-section__lead {
          font-size: 15px; line-height: 1.85;
          color: #4a5961;
          margin: 0 0 40px;
        }
        .lp-form {
          background: #fff;
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 8px 32px rgba(28,46,36,0.06);
        }
        .lp-form__row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        @media (max-width: 640px) { .lp-form__row { grid-template-columns: 1fr; } }
        .lp-form label { display: flex; flex-direction: column; gap: 6px; }
        .lp-form label > span { font-size: 12px; font-weight: 600; color: #4a5961; }
        .lp-form input, .lp-form textarea {
          padding: 12px 16px;
          font-size: 14px;
          border: 1px solid rgba(28,46,36,0.12);
          border-radius: 10px;
          background: #fafbfa;
          outline: none;
          transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .lp-form input:focus, .lp-form textarea:focus {
          border-color: #2da76e;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(45,167,110,0.15);
        }
        .lp-form textarea { resize: vertical; min-height: 120px; }
        .lp-form__submit {
          margin-top: 32px;
          display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
        }
        .lp-form__note { font-size: 12px; color: #8e9ba3; }

        /* ============== FOOTER ============== */
        .lp-footer { background: #18221d; color: rgba(255,255,255,0.7); padding: 48px 32px; }
        .lp-footer__inner { max-width: 1280px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
        .lp-footer__brand { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; color: #fff; }
        .lp-footer__copy { font-size: 12px; }

        /* ============== FLOATING CONTACT ============== */
        .lp-contact {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 60;
          opacity: 0;
          transform: translateY(20px) scale(0.9);
          pointer-events: none;
          transition: opacity 0.3s, transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        .lp-contact.is-open {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .lp-contact__bubble {
          width: 56px; height: 56px;
          border-radius: 999px;
          background: #18221d;
          color: #fff;
          border: 0;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 8px 24px rgba(0,0,0,0.22);
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .lp-contact__bubble:hover { transform: scale(1.05); box-shadow: 0 12px 32px rgba(0,0,0,0.28); }
        .lp-contact__card {
          background: #fff;
          border-radius: 16px;
          padding: 18px 18px 16px;
          width: 280px;
          box-shadow: 0 12px 36px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08);
          border: 1px solid rgba(28,46,36,0.06);
        }
        .lp-contact__head {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 8px;
        }
        .lp-contact__head > svg { color: #2da76e; }
        .lp-contact__head strong { flex: 1; font-size: 13px; }
        .lp-contact__close {
          background: transparent;
          border: 0;
          color: #8e9ba3;
          padding: 4px;
          border-radius: 4px;
          display: inline-flex;
          transition: background 0.1s;
        }
        .lp-contact__close:hover { background: rgba(28,46,36,0.06); color: #18221d; }
        .lp-contact__card p {
          font-size: 12px; line-height: 1.7; color: #4a5961;
          margin: 0 0 14px;
        }
        .lp-contact__actions { display: flex; gap: 6px; }
        .lp-contact .lp-btn { border: 1px solid rgba(28,46,36,0.10); background: #fff; color: #18221d; }
        .lp-contact .lp-btn--primary { background: #18221d; color: #fff; border-color: transparent; }
      `}</style>
    </div>
  );
}

// =========================================================
// BIG SECTION (scroll-triggered reveal)
// =========================================================
interface BigSectionProps {
  id: string;
  label: string;
  title: React.ReactNode;
  lead: string;
  side: React.ReactNode;
}
function BigSection({ id, label, title, lead, side }: BigSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) setVisible(true);
      }),
      { threshold: 0.18 },
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return (
    <section ref={ref} id={id} className={`lp-big ${visible ? "is-visible" : ""}`}>
      <div className="lp-big__inner">
        <div className="lp-big__lead">
          <p className="lp-big__label">{label}</p>
          <h2 className="lp-big__title">{title}</h2>
          <p className="lp-big__desc">{lead}</p>
        </div>
        <div className="lp-big__side">{side}</div>
      </div>
    </section>
  );
}
