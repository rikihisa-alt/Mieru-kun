"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Play, Pause, Square, Coffee } from "lucide-react";
import { attendanceAction, getAttendanceStatus } from "@/lib/actions/attendance-actions";
import type { AttendanceLog } from "@/types/database";
import { formatTime, formatMinutes } from "@/lib/utils";

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadStatus();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  async function loadStatus() {
    try {
      const status = await getAttendanceStatus();
      setAttendance(status);
    } catch {
      // Supabase未接続
    }
  }

  async function handleAction(action: string) {
    setLoading(true);
    setMessage("");
    const fd = new FormData();
    fd.set("action", action);
    const result = await attendanceAction(fd);
    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage(
        action === "clock_in" ? "出勤しました" :
        action === "clock_out" ? "退勤しました" :
        action === "break_start" ? "休憩を開始しました" :
        "休憩を終了しました"
      );
      await loadStatus();
    }
    setLoading(false);
  }

  const status = attendance?.status;
  const isWorking = status === "working";
  const isOnBreak = status === "on_break";
  const isFinished = status === "finished";
  const notStarted = !attendance || isFinished;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold">出退勤</h1>

      {/* 現在時刻 */}
      <Card className="text-center">
        <Clock className="w-8 h-8 mx-auto text-primary mb-2" />
        <p className="text-3xl font-bold font-mono">
          {currentTime.toLocaleTimeString("ja-JP")}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {currentTime.toLocaleDateString("ja-JP", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "short",
          })}
        </p>
      </Card>

      {/* ステータス */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium">ステータス</span>
          <Badge
            variant={
              isWorking ? "success" :
              isOnBreak ? "warning" :
              isFinished ? "info" :
              "default"
            }
          >
            {isWorking ? "勤務中" :
             isOnBreak ? "休憩中" :
             isFinished ? "退勤済" :
             "未出勤"}
          </Badge>
        </div>

        {attendance?.clock_in && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">出勤時刻</span>
              <span className="font-medium">{formatTime(attendance.clock_in)}</span>
            </div>
            {attendance.clock_out && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">退勤時刻</span>
                <span className="font-medium">{formatTime(attendance.clock_out)}</span>
              </div>
            )}
            {(attendance.break_minutes ?? 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">休憩時間</span>
                <span className="font-medium">{formatMinutes(attendance.break_minutes)}</span>
              </div>
            )}
            {attendance.work_minutes != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">勤務時間</span>
                <span className="font-bold">{formatMinutes(attendance.work_minutes)}</span>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* アクションボタン */}
      <div className="space-y-3">
        {notStarted && (
          <Button
            size="lg"
            className="w-full py-4 text-base"
            onClick={() => handleAction("clock_in")}
            disabled={loading}
          >
            <Play className="w-5 h-5" />
            出勤する
          </Button>
        )}

        {isWorking && (
          <>
            <Button
              size="lg"
              variant="secondary"
              className="w-full py-4 text-base"
              onClick={() => handleAction("break_start")}
              disabled={loading}
            >
              <Coffee className="w-5 h-5" />
              休憩開始
            </Button>
            <Button
              size="lg"
              variant="danger"
              className="w-full py-4 text-base"
              onClick={() => handleAction("clock_out")}
              disabled={loading}
            >
              <Square className="w-5 h-5" />
              退勤する
            </Button>
          </>
        )}

        {isOnBreak && (
          <Button
            size="lg"
            variant="success"
            className="w-full py-4 text-base"
            onClick={() => handleAction("break_end")}
            disabled={loading}
          >
            <Pause className="w-5 h-5" />
            休憩終了
          </Button>
        )}
      </div>

      {message && (
        <p className={`text-sm text-center ${message.includes("失敗") || message.includes("ません") ? "text-danger" : "text-success"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
