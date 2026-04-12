"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface SalesChartProps {
  data: { date: string; sales: number; visitors: number }[];
}

export function SalesChart({ data }: SalesChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
        日次締めを行うとグラフが表示されます
      </div>
    );
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" fontSize={12} tick={{ fill: "#64748b" }} />
          <YAxis fontSize={12} tick={{ fill: "#64748b" }} />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="sales"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="売上"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
