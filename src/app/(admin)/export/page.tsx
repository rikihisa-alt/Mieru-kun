"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download } from "lucide-react";

interface ExportCardProps {
  title: string;
  description: string;
}

function ExportCard({ title, description }: ExportCardProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  function handleExport() {
    alert("CSV出力は今後実装予定です");
  }

  return (
    <Card>
      <div className="flex items-start gap-3 mb-4">
        <Download className="w-5 h-5 text-primary mt-0.5" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex items-end gap-3">
        <Input
          label="開始日"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="終了日"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Button onClick={handleExport} variant="secondary" className="shrink-0">
          <Download className="w-4 h-4" />
          CSVダウンロード
        </Button>
      </div>
    </Card>
  );
}

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Download className="w-7 h-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">データ出力</h1>
          <p className="text-sm text-muted-foreground">
            各種データをCSVでエクスポート
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <ExportCard
          title="売上データ"
          description="日別の売上集計データを出力します"
        />
        <ExportCard
          title="顧客データ"
          description="顧客一覧と来店・購入履歴を出力します"
        />
        <ExportCard
          title="勤怠データ"
          description="スタッフの勤怠記録を出力します"
        />
        <ExportCard
          title="締めデータ"
          description="日次締めの集計結果を出力します"
        />
        <ExportCard
          title="在庫データ"
          description="商品在庫と入出庫履歴を出力します"
        />
      </div>
    </div>
  );
}
