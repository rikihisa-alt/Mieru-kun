import { getCustomers } from "@/lib/db/customers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, ChevronRight } from "lucide-react";
import { formatCurrency, rankLabel, rankColor } from "@/lib/utils";
import Link from "next/link";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const search = params.q || "";
  let customers: Awaited<ReturnType<typeof getCustomers>> = [];

  try {
    customers = await getCustomers(search || undefined);
  } catch {
    // Supabase未接続
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold">顧客一覧</h1>
        <Link href="/customers/new">
          <Button size="sm">
            <Plus className="w-4 h-4" />
            新規登録
          </Button>
        </Link>
      </div>

      {/* 検索 */}
      <form method="GET" className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          name="q"
          type="text"
          defaultValue={search}
          placeholder="名前・電話番号で検索"
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </form>

      {/* 顧客リスト */}
      <div className="space-y-2">
        {customers.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {search ? "該当する顧客が見つかりません" : "顧客がまだ登録されていません"}
            </p>
          </Card>
        ) : (
          customers.map((customer) => (
            <Link key={customer.id} href={`/customers/${customer.id}`}>
              <Card className="flex items-center justify-between hover:bg-muted/30 transition-colors mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">{customer.name}</span>
                    <Badge variant="custom" className={rankColor(customer.rank)}>
                      {rankLabel(customer.rank)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>来店 {customer.total_visits}回</span>
                    <span>累計 {formatCurrency(customer.total_spent)}</span>
                    {customer.phone && <span>{customer.phone}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
