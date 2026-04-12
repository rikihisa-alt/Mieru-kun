"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    // TODO: Supabase に店舗を保存する処理を実装
    // const formData = new FormData(e.currentTarget);

    // 仮の処理: 店舗一覧に戻る
    router.push("/stores");
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/stores"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          店舗一覧に戻る
        </Link>
      </div>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">店舗を追加</h1>

        <div className="bg-white rounded-xl border border-border p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1"
              >
                店舗名 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="例: 渋谷店"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium mb-1"
              >
                住所
              </label>
              <input
                id="address"
                name="address"
                type="text"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="例: 東京都渋谷区..."
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium mb-1"
              >
                電話番号
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                placeholder="例: 03-1234-5678"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-1"
              >
                メモ
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                placeholder="店舗に関するメモ..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
              >
                {loading ? "保存中..." : "保存"}
              </button>
              <Link
                href="/stores"
                className="px-6 py-2.5 border border-border text-gray-700 font-medium rounded-lg hover:bg-muted transition-colors"
              >
                キャンセル
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
