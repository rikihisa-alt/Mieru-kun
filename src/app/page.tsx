import Link from "next/link";
import { Store, BarChart3, Users, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="border-b border-border">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            店舗の「いま」が
            <br />
            <span className="text-primary">ひと目でわかる</span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
            売上・在庫・スタッフの状況をリアルタイムに把握。
            <br />
            店舗運営をもっとシンプルに、もっとスマートに。
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
        <section className="bg-muted py-20">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-12">主な機能</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<BarChart3 className="w-8 h-8 text-primary" />}
                title="売上ダッシュボード"
                description="日別・月別の売上推移をグラフで確認。目標達成率もひと目でわかります。"
              />
              <FeatureCard
                icon={<Store className="w-8 h-8 text-primary" />}
                title="店舗管理"
                description="複数店舗の情報を一元管理。店舗ごとのパフォーマンスを比較できます。"
              />
              <FeatureCard
                icon={<Users className="w-8 h-8 text-primary" />}
                title="スタッフ管理"
                description="シフトや勤怠を管理。スタッフごとの売上貢献度も可視化します。"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
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
    <div className="bg-white rounded-xl p-6 shadow-sm border border-border">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
