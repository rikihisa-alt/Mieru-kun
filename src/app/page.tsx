import Link from "next/link";
import { Store, BarChart3, Users, ShoppingCart, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            <span className="text-xl font-bold">てんぽみえるくん</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-6xl mx-auto px-4 py-24 text-center">
          <p className="text-sm font-medium text-primary mb-4">
            アミューズメントカジノ店舗向け 運営管理システム
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            店舗の「いま」が
            <br />
            <span className="text-primary">ひと目でわかる</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            入退店・注文・売上・顧客をリアルタイムに管理。
            <br />
            LINE連携で現場オペレーションをもっとスマートに。
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-3 text-lg font-medium bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
          >
            無料で始める
            <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

        {/* Features */}
        <section className="bg-white py-20 border-y border-border">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-12">主な機能</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <FeatureCard
                icon={<Store className="w-7 h-7 text-primary" />}
                title="入退店管理"
                description="来店から精算まで、顧客の滞在をリアルタイムに追跡します。"
              />
              <FeatureCard
                icon={<ShoppingCart className="w-7 h-7 text-primary" />}
                title="注文管理"
                description="タッチ操作で素早く注文。卓・顧客に紐づけて売上を自動集計。"
              />
              <FeatureCard
                icon={<BarChart3 className="w-7 h-7 text-primary" />}
                title="売上分析"
                description="日別・商品別・顧客別の売上をグラフで可視化。KPIも一目瞭然。"
              />
              <FeatureCard
                icon={<Users className="w-7 h-7 text-primary" />}
                title="顧客管理"
                description="来店履歴・チップ・ポイント・ランクを一元管理。VIP対応も万全。"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} てんぽみえるくん All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl p-5 border border-border hover:shadow-sm transition-shadow">
      <div className="mb-3">{icon}</div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
    </div>
  );
}
