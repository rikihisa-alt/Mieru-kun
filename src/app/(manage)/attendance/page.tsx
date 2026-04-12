import { getAuthContext } from "@/lib/auth";
import { DEMO_STORE_ID } from "@/lib/utils";
import { Clock } from "lucide-react";

export default async function AttendancePage() {
  const ctx = await getAuthContext();
  const storeId = ctx?.storeId ?? DEMO_STORE_ID;

  const today = new Date().toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <div className="space-y-4 max-w-5xl">
      {/* 日付表示 */}
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-text-secondary">{today}</span>
      </div>

      {/* テーブル */}
      <div className="bg-bg-white border border-border rounded-[var(--radius-lg)] overflow-hidden">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">スタッフ名</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">出勤</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">退勤</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">休憩</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">勤務時間</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">ステータス</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-text-tertiary">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>勤怠データは出退勤操作から記録されます</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
