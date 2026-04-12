"use server";

import { revalidatePath } from "next/cache";
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getTodayAttendance,
} from "@/lib/db/attendance";

// MVPではダミーのスタッフIDを使用
const DEMO_STAFF_ID = "00000000-0000-0000-0000-000000000011";

export async function attendanceAction(formData: FormData) {
  const action = formData.get("action") as string;

  try {
    const current = await getTodayAttendance(DEMO_STAFF_ID);

    switch (action) {
      case "clock_in":
        if (current && current.status !== "finished") {
          return { error: "すでに出勤中です" };
        }
        await clockIn(DEMO_STAFF_ID);
        break;
      case "clock_out":
        if (!current || current.status === "finished") {
          return { error: "出勤記録がありません" };
        }
        await clockOut(current.id);
        break;
      case "break_start":
        if (!current || current.status !== "working") {
          return { error: "勤務中でないと休憩できません" };
        }
        await startBreak(current.id);
        break;
      case "break_end":
        if (!current || current.status !== "on_break") {
          return { error: "休憩中ではありません" };
        }
        await endBreak(current.id);
        break;
      default:
        return { error: "不正な操作です" };
    }

    revalidatePath("/attendance");
    return { success: true };
  } catch (e) {
    console.error("attendance error:", e);
    return { error: "操作に失敗しました" };
  }
}

export async function getAttendanceStatus() {
  try {
    return await getTodayAttendance(DEMO_STAFF_ID);
  } catch {
    return null;
  }
}
