"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, CheckCircle, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PrizeMaster, Customer } from "@/types/database";
import { DEMO_STORE_ID, formatCurrency } from "@/lib/utils";

export default function PrizesPage() {
  const [prizes, setPrizes] = useState<PrizeMaster[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const [prizesRes, customersRes] = await Promise.all([
        supabase.from("prize_masters").select("*").eq("store_id", DEMO_STORE_ID).eq("is_active", true).order("sort_order"),
        supabase.from("customers").select("*").eq("store_id", DEMO_STORE_ID).order("name"),
      ]);
      setPrizes((prizesRes.data as PrizeMaster[]) ?? []);
      setCustomers((customersRes.data as Customer[]) ?? []);
    } catch { /* demo mode */ }
  }

  const filtered = customers.filter(c => c.name.includes(search) || (c.phone && c.phone.includes(search)));

  async function handleGrant(prize: PrizeMaster) {
    if (!selectedCustomer) return;
    if (selectedCustomer.point_balance < prize.points_required) {
      setMessage("ポイントが不足しています");
      return;
    }
    // TODO: Server Action経由で実行（prize-actions.ts完成後）
    setSuccess(true);
    setMessage(`${selectedCustomer.name}さんに${prize.name}を付与しました`);
    setTimeout(() => { setSuccess(false); setMessage(""); setSelectedCustomer(null); }, 2000);
  }

  if (success) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold">プライズ交換</h1>
        <Card className="text-center py-10">
          <CheckCircle className="w-12 h-12 mx-auto text-success mb-3" />
          <p className="text-lg font-medium text-success">{message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">プライズ交換</h1>

      {!selectedCustomer ? (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="顧客を検索..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filtered.map(c => (
              <Card key={c.id} className="cursor-pointer hover:bg-muted/30 active:bg-muted/50" onClick={() => setSelectedCustomer(c)}>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{c.name}</span>
                  <span className="text-xs text-primary font-medium">{c.point_balance.toLocaleString()}pt</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Card className="flex items-center justify-between !py-3">
            <div>
              <p className="font-medium text-sm">{selectedCustomer.name}</p>
              <p className="text-xs text-primary font-medium">保有ポイント: {selectedCustomer.point_balance.toLocaleString()}pt</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelectedCustomer(null)}>変更</Button>
          </Card>

          {message && <p className="text-sm text-danger text-center">{message}</p>}

          <div className="space-y-2">
            {prizes.length === 0 ? (
              <Card className="text-center py-8"><p className="text-sm text-muted-foreground">プライズが登録されていません</p></Card>
            ) : prizes.map(prize => (
              <Card key={prize.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gift className="w-8 h-8 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{prize.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{prize.points_required.toLocaleString()}pt</span>
                      <Badge variant={prize.stock > 0 ? "success" : "danger"}>残{prize.stock}</Badge>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={selectedCustomer.point_balance < prize.points_required || prize.stock <= 0}
                  onClick={() => handleGrant(prize)}
                >
                  交換
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
