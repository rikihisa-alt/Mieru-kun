import Link from "next/link";
import { Plus, Building2 } from "lucide-react";

export default function StoresPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">店舗管理</h1>
        <Link
          href="/stores/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          店舗を追加
        </Link>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-border p-12 text-center">
        <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-gray-700 mb-2">
          まだ店舗が登録されていません
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          「店舗を追加」ボタンから最初の店舗を登録しましょう
        </p>
        <Link
          href="/stores/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors"
        >
          <Plus className="w-4 h-4" />
          店舗を追加
        </Link>
      </div>
    </div>
  );
}
