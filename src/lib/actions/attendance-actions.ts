"use server";

import { revalidatePath } from "next/cache";
import {
  clockIn,
  clockOut,
  startBreak,
  endBreak,
  getTodayAttendance,
} from "@/lib/db/attendance";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import type { AuditAction } from "@/lib/audit";

export async function attendanceAction(formData: FormData) {
  // 1. 認証・権限
  let ctx;
  try {
    ctx = await requireRole("staff");
  } catch {
    return { error: "権限がありません" };
  }

  const action = formData.get("action") as string;
  if (!["clock_in", "clock_out", "break_start", "break_end"].includes(action)) {
    return { error: "不正な操作です" };
  }

  try {
    const current = await getTodayAttendance(ctx.userId);

    let auditAction: AuditAction;
    let targetId: string | undefined;

    switch (action) {
      case "clock_in":
        if (current && current.status !== "finished") {
          return { error: "すでに出勤中です" };
        }
        const newLog = await clockIn(ctx.userId);
        targetId = newLog.id;
        auditAction = "attendance.clockin";
        break;
      case "clock_out":
        if (!current || current.status === "finished") {
          return { error: "出勤記録がありません" };
        }
        await clockOut(current.id);
        targetId = current.id;
        auditAction = "attendance.clockout";
        break;
      case "break_start":
        if (!current || current.status !== "working") {
          return { error: "勤務中でないと休憩できません" };
        }
        await startBreak(current.id);
        targetId = current.id;
        auditAction = "attendance.break_start";
        break;
      case "break_end":
        if (!current || current.status !== "on_break") {
          return { error: "休憩中ではありません" };
        }
        await endBreak(current.id);
        targetId = current.id;
        auditAction = "attendance.break_end";
        break;
      default:
        return { error: "不正な操作です" };
    }

    // 監査ログ
    await writeAuditLog({
      ctx,
      action: auditAction,
      targetTable: "attendance_logs",
      targetId,
    });

    revalidatePath("/z5b7lc");
    return { success: true };
  } catch (e) {
    console.error("attendance error:", e);
    return { error: "操作に失敗しました" };
  }
}

export async function getAttendanceStatus() {
  let ctx;
  try {
    const { requireAuth } = await import("@/lib/auth");
    ctx = await requireAuth();
  } catch {
    return null;
  }

  try {
    return await getTodayAttendance(ctx.userId);
  } catch {
    return null;
  }
}
