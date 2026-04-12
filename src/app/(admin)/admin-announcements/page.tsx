"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Bell, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Announcement, AnnouncementTarget } from "@/types/database";
import { DEMO_STORE_ID, formatDate } from "@/lib/utils";

const targetLabel: Record<AnnouncementTarget, string> = {
  all: "全員",
  staff: "スタッフ",
  customers: "顧客",
};

const targetVariant: Record<AnnouncementTarget, "info" | "warning" | "success"> = {
  all: "info",
  staff: "warning",
  customers: "success",
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function loadAnnouncements() {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("announcements")
        .select("*")
        .eq("store_id", DEMO_STORE_ID)
        .order("created_at", { ascending: false });
      setAnnouncements((data as Announcement[]) ?? []);
    } catch {
      // Supabase未接続
    }
  }

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData(e.currentTarget);
    const title = fd.get("title") as string;
    const body = fd.get("body") as string;
    const target = fd.get("target") as AnnouncementTarget;

    if (!title) {
      setError("タイトルは必須です");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("announcements")
        .insert({
          store_id: DEMO_STORE_ID,
          title,
          body: body || null,
          target,
          published_at: new Date().toISOString(),
        });
      if (insertError) throw insertError;
      setShowForm(false);
      await loadAnnouncements();
    } catch {
      setError("お知らせの登録に失敗しました");
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">お知らせ管理</h1>
            <p className="text-sm text-muted-foreground">
              {announcements.length}件のお知らせ
            </p>
          </div>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" />
          お知らせを追加
        </Button>
      </div>

      {showForm && (
        <Card>
          <h2 className="font-semibold mb-4">新規お知らせ</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              id="title"
              name="title"
              label="タイトル *"
              placeholder="お知らせのタイトル"
              required
            />
            <div className="space-y-1">
              <label
                htmlFor="body"
                className="block text-sm font-medium text-foreground"
              >
                本文
              </label>
              <textarea
                id="body"
                name="body"
                rows={4}
                className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="お知らせの内容..."
              />
            </div>
            <Select
              id="target"
              name="target"
              label="対象"
              options={[
                { value: "all", label: "全員" },
                { value: "staff", label: "スタッフ" },
                { value: "customers", label: "顧客" },
              ]}
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "登録中..." : "登録"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
              >
                キャンセル
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card padding={false}>
        {announcements.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            お知らせがまだ登録されていません
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableHead>タイトル</TableHead>
              <TableHead>対象</TableHead>
              <TableHead>公開日</TableHead>
            </TableHeader>
            <TableBody>
              {announcements.map((ann) => (
                <TableRow key={ann.id}>
                  <TableCell className="font-medium">{ann.title}</TableCell>
                  <TableCell>
                    <Badge variant={targetVariant[ann.target]}>
                      {targetLabel[ann.target]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {ann.published_at
                      ? formatDate(ann.published_at)
                      : "未公開"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
