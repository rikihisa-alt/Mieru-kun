"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ticket, Search, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CouponMaster, Customer } from "@/types/database";
import { DEMO_STORE_ID } from "@/lib/utils";

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponMaster[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const [couponsRes, customersRes] = await Promise.all([
        supabase.from("coupon_masters").select("*").eq("store_id", DEMO_STORE_ID).eq("is_active", true),
        supabase.from("customers").select("*").eq("store_id", DEMO_STORE_ID).order("name"),
      ]);
      setCoupons((couponsRes.data as CouponMaster[]) ?? []);
      setCustomers((customersRes.data as Customer[]) ?? []);
    } catch { /* demo mode */ }
  }

  const filtered = customers.filter(c => c.name.includes(search));

  function handleIssue(coupon: CouponMaster) {
    if (!selectedCustomer) return;
    setSuccess(true);
    setMessage(`${selectedCustomer.name}さんに「${coupon.name}」を発行しました`);
    setTimeout(() => { setSuccess(false); setMessage(""); setSelectedCustomer(null); }, 2000);
  }

  const discountLabel = (c: CouponMaster) => {
    if (c.discount_type === "fixed") return `¥${c.discount_value}OFF`;
    if (c.discount_type === "percent") return `${c.discount_value}%OFF`;
    return "無料";
  };

  if (success) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold">クーポン管理</h1>
        <Card className="text-center py-10">
          <CheckCircle className="w-12 h-12 mx-auto text-success mb-3" />
          <p className="text-lg font-medium text-success">{message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">クーポン管理</h1>

      {!selectedCustomer ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">クーポンを発行する顧客を選択</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="顧客を検索..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filtered.map(c => (
              <Card key={c.id} className="cursor-pointer hover:bg-muted/30 active:bg-muted/50" onClick={() => setSelectedCustomer(c)}>
                <span className="font-medium text-sm">{c.name}</span>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Card className="flex items-center justify-between !py-3">
            <p className="font-medium text-sm">{selectedCustomer.name}</p>
            <Button size="sm" variant="ghost" onClick={() => setSelectedCustomer(null)}>変更</Button>
          </Card>
          <p className="text-sm text-muted-foreground">発行するクーポンを選択</p>
          {coupons.length === 0 ? (
            <Card className="text-center py-8"><p className="text-sm text-muted-foreground">クーポンが登録されていません</p></Card>
          ) : coupons.map(coupon => (
            <Card key={coupon.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Ticket className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-medium text-sm">{coupon.name}</p>
                  <Badge variant="info">{discountLabel(coupon)}</Badge>
                </div>
              </div>
              <Button size="sm" onClick={() => handleIssue(coupon)}>発行</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
