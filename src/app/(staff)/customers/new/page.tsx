"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createCustomerAction } from "@/lib/actions/customer-actions";

export default function NewCustomerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createCustomerAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/customers");
    }
  }

  return (
    <div className="space-y-4">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        顧客一覧に戻る
      </Link>

      <h1 className="text-lg font-bold">顧客新規登録</h1>

      <Card>
        {error && (
          <div className="mb-4 p-3 bg-danger-light text-danger text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="name"
            name="name"
            label="名前 *"
            placeholder="田中 太郎"
            required
          />
          <Input
            id="phone"
            name="phone"
            label="電話番号"
            type="tel"
            placeholder="090-1234-5678"
          />
          <Input
            id="email"
            name="email"
            label="メールアドレス"
            type="email"
            placeholder="example@email.com"
          />
          <Select
            id="rank"
            name="rank"
            label="ランク"
            options={[
              { value: "regular", label: "レギュラー" },
              { value: "silver", label: "シルバー" },
              { value: "gold", label: "ゴールド" },
              { value: "vip", label: "VIP" },
            ]}
          />
          <div className="space-y-1">
            <label htmlFor="notes" className="block text-sm font-medium">メモ</label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="備考を入力..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "登録中..." : "登録する"}
            </Button>
            <Link href="/customers">
              <Button type="button" variant="secondary">
                キャンセル
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
