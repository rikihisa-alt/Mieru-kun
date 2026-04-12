import { createClient } from "@/lib/supabase/server";
import type { AttendanceLog } from "@/types/database";
import { DEMO_STORE_ID } from "@/lib/utils";

export async function getTodayAttendance(staffId: string): Promise<AttendanceLog | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("staff_id", staffId)
    .gte("created_at", `${today}T00:00:00`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  if (error) return null;
  return data as AttendanceLog;
}

export async function clockIn(staffId: string): Promise<AttendanceLog> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_logs")
    .insert({
      store_id: DEMO_STORE_ID,
      staff_id: staffId,
      clock_in: new Date().toISOString(),
      status: "working",
    })
    .select()
    .single();
  if (error) throw error;
  return data as AttendanceLog;
}

export async function clockOut(logId: string): Promise<AttendanceLog> {
  const supabase = await createClient();
  const now = new Date();

  // 既存ログを取得して勤務時間を計算
  const { data: log } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("id", logId)
    .single();

  let workMinutes = 0;
  if (log?.clock_in) {
    const totalMinutes = Math.round(
      (now.getTime() - new Date(log.clock_in).getTime()) / 60000
    );
    workMinutes = totalMinutes - (log.break_minutes || 0);
  }

  const { data, error } = await supabase
    .from("attendance_logs")
    .update({
      clock_out: now.toISOString(),
      status: "finished",
      work_minutes: workMinutes,
    })
    .eq("id", logId)
    .select()
    .single();
  if (error) throw error;
  return data as AttendanceLog;
}

export async function startBreak(logId: string): Promise<AttendanceLog> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("attendance_logs")
    .update({
      break_start: new Date().toISOString(),
      status: "on_break",
    })
    .eq("id", logId)
    .select()
    .single();
  if (error) throw error;
  return data as AttendanceLog;
}

export async function endBreak(logId: string): Promise<AttendanceLog> {
  const supabase = await createClient();
  const now = new Date();

  const { data: log } = await supabase
    .from("attendance_logs")
    .select("break_start, break_minutes")
    .eq("id", logId)
    .single();

  let addedBreak = 0;
  if (log?.break_start) {
    addedBreak = Math.round(
      (now.getTime() - new Date(log.break_start).getTime()) / 60000
    );
  }

  const { data, error } = await supabase
    .from("attendance_logs")
    .update({
      break_end: now.toISOString(),
      break_minutes: (log?.break_minutes || 0) + addedBreak,
      status: "working",
    })
    .eq("id", logId)
    .select()
    .single();
  if (error) throw error;
  return data as AttendanceLog;
}
