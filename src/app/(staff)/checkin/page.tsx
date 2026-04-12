"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, LogIn, CheckCircle } from "lucide-react";
import { checkinAction } from "@/lib/actions/visit-actions";
import { rankLabel, rankColor } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/types/database";
import { DEMO_STORE_ID } from "@/lib/utils";

export default function CheckinPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [tableNumber, setTableNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("customers")
        .select("*")
        .eq("store_id", DEMO_STORE_ID)
        .order("name");
      setCustomers((data as Customer[]) ?? []);
    } catch {
      // Supabase未接続
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.includes(search) ||
      (c.phone && c.phone.includes(search))
  );

  async function handleCheckin() {
    if (!selectedCustomer) return;
    setLoading(true);
    setMessage("");

    const fd = new FormData();
    fd.set("customer_id", selectedCustomer.id);
    fd.set("table_number", tableNumber);

    const result = await checkinAction(fd);
    if (result.error) {
      setMessage(result.error);
    } else {
      setSuccess(true);
      setMessage(`${selectedCustomer.name}さんの入店を登録しました`);
      setTimeout(() => {
        setSelectedCustomer(null);
        setTableNumber("");
        setSuccess(false);
        setMessage("");
      }, 2000);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold">入店登録</h1>
        <Card className="text-center py-10">
          <CheckCircle className="w-12 h-12 mx-auto text-success mb-3" />
          <p className="text-lg font-medium text-success">{message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">入店登録</h1>

      {/* 顧客選択済み → 卓番号入力 */}
      {selectedCustomer ? (
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{selectedCustomer.name}</p>
                <Badge variant="custom" className={rankColor(selectedCustomer.rank)}>
                  {rankLabel(selectedCustomer.rank)}
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedCustomer(null)}
              >
                変更
              </Button>
            </div>
          </Card>

          <Input
            label="卓番号（任意）"
            placeholder="例: A-1, 3番テーブル"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
          />

          {message && <p className="text-sm text-danger">{message}</p>}

          <Button
            size="lg"
            className="w-full py-4 text-base"
            onClick={handleCheckin}
            disabled={loading}
          >
            <LogIn className="w-5 h-5" />
            {loading ? "登録中..." : "入店を登録する"}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* 検索 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="顧客を検索..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* 顧客リスト */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filtered.map((customer) => (
              <Card
                key={customer.id}
                className="cursor-pointer hover:bg-muted/30 active:bg-muted/50 transition-colors"
                onClick={() => setSelectedCustomer(customer)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-sm">{customer.name}</span>
                    <Badge variant="custom" className={`ml-2 ${rankColor(customer.rank)}`}>
                      {rankLabel(customer.rank)}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {customer.total_visits}回来店
                  </span>
                </div>
              </Card>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                顧客が見つかりません
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
