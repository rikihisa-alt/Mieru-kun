"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, ClipboardCheck } from "lucide-react";
import { executeClosingAction } from "@/lib/actions/closing-actions";
import { todayString } from "@/lib/utils";

export default function ClosingPage() {
  const [date, setDate] = useState(todayString());
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleClose() {
    setLoading(true);
    setMessage("");

    const fd = new FormData();
    fd.set("date", date);
    fd.set("notes", notes);

    const result = await executeClosingAction(fd);
    if (result.error) {
      setMessage(result.error);
    } else {
      setSuccess(true);
      setMessage("日次締めが完了しました");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">日次締め</h1>
        <Card className="text-center py-12">
          <CheckCircle className="w-16 h-16 mx-auto text-success mb-4" />
          <p className="text-xl font-semibold text-success">{message}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {date} の締め処理が完了しました
          </p>
          <Button
            variant="secondary"
            className="mt-6"
            onClick={() => {
              setSuccess(false);
              setMessage("");
              setNotes("");
            }}
          >
            戻る
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">日次締め</h1>

      <Card className="max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardCheck className="w-6 h-6 text-primary" />
          <div>
            <p className="font-semibold">締め作業</p>
            <p className="text-sm text-muted-foreground">
              指定日の売上・来店データを集計して確定します
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="対象日"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium">メモ（任意）</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              placeholder="締め作業に関するメモ..."
            />
          </div>

          {message && <p className="text-sm text-danger">{message}</p>}

          <Button
            size="lg"
            className="w-full"
            onClick={handleClose}
            disabled={loading}
          >
            {loading ? "集計中..." : "締め処理を実行する"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
