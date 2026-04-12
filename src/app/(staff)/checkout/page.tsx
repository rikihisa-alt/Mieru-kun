"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { LogOut, CheckCircle } from "lucide-react";
import { checkoutAction } from "@/lib/actions/visit-actions";
import { createClient } from "@/lib/supabase/client";
import type { VisitWithCustomer } from "@/types/database";
import {
  DEMO_STORE_ID,
  formatCurrency,
  formatTime,
  formatMinutes,
} from "@/lib/utils";

export default function CheckoutPage() {
  const [visits, setVisits] = useState<VisitWithCustomer[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<VisitWithCustomer | null>(null);
  const [method, setMethod] = useState("cash");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadActiveVisits();
  }, []);

  async function loadActiveVisits() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("visits")
        .select("*, customer:customers(*)")
        .eq("store_id", DEMO_STORE_ID)
        .eq("status", "active")
        .order("check_in_at", { ascending: false });
      setVisits((data as VisitWithCustomer[]) ?? []);
    } catch {
      // Supabase未接続
    }
  }

  function getStayMinutes(checkInAt: string): number {
    return Math.round(
      (Date.now() - new Date(checkInAt).getTime()) / 60000
    );
  }

  async function handleCheckout() {
    if (!selectedVisit) return;
    setLoading(true);
    setMessage("");

    const fd = new FormData();
    fd.set("visit_id", selectedVisit.id);
    fd.set("total_amount", String(selectedVisit.total_amount));
    fd.set("method", method);
    fd.set("customer_id", selectedVisit.customer_id);

    const result = await checkoutAction(fd);
    if (result.error) {
      setMessage(result.error);
    } else {
      setSuccess(true);
      setMessage(`${selectedVisit.customer?.name}さんの精算が完了しました`);
      setTimeout(() => {
        setSelectedVisit(null);
        setSuccess(false);
        setMessage("");
        loadActiveVisits();
      }, 2000);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-bold">退店 / 精算</h1>
        <Card className="text-center py-10">
          <CheckCircle className="w-12 h-12 mx-auto text-success mb-3" />
          <p className="text-lg font-medium text-success">{message}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">退店 / 精算</h1>

      {selectedVisit ? (
        <div className="space-y-4">
          {/* 精算確認 */}
          <Card>
            <h2 className="font-semibold mb-3">精算内容</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">顧客</span>
                <span className="font-medium">{selectedVisit.customer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">入店時刻</span>
                <span>{formatTime(selectedVisit.check_in_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">滞在時間</span>
                <span>{formatMinutes(getStayMinutes(selectedVisit.check_in_at))}</span>
              </div>
              {selectedVisit.table_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">卓番号</span>
                  <span>{selectedVisit.table_number}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-border pt-2 mt-2">
                <span className="font-semibold">合計金額</span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(selectedVisit.total_amount)}
                </span>
              </div>
            </div>
          </Card>

          <Select
            label="支払方法"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            options={[
              { value: "cash", label: "現金" },
              { value: "card", label: "カード" },
              { value: "electronic", label: "電子マネー" },
            ]}
          />

          {message && <p className="text-sm text-danger">{message}</p>}

          <div className="flex gap-3">
            <Button
              size="lg"
              variant="success"
              className="flex-1 py-4 text-base"
              onClick={handleCheckout}
              disabled={loading}
            >
              <LogOut className="w-5 h-5" />
              {loading ? "処理中..." : "精算する"}
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setSelectedVisit(null)}
            >
              戻る
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground mb-2">
            来店中のお客様 ({visits.length}名)
          </p>
          {visits.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-sm text-muted-foreground">現在来店中のお客様はいません</p>
            </Card>
          ) : (
            visits.map((visit) => (
              <Card
                key={visit.id}
                className="cursor-pointer hover:bg-muted/30 active:bg-muted/50 transition-colors"
                onClick={() => setSelectedVisit(visit)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{visit.customer?.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{formatTime(visit.check_in_at)}〜</span>
                      <span>{formatMinutes(getStayMinutes(visit.check_in_at))}</span>
                      {visit.table_number && (
                        <Badge variant="default">卓 {visit.table_number}</Badge>
                      )}
                    </div>
                  </div>
                  <span className="font-bold text-sm">
                    {formatCurrency(visit.total_amount)}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
