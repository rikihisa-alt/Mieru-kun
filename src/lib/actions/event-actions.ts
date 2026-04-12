"use server";

import { revalidatePath } from "next/cache";
import {
  eventCreateSchema,
  eventEntrySchema,
} from "@/lib/validations/schemas";
import {
  createEvent,
  createEventEntry,
  createEventResult,
} from "@/lib/db/events";
import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function createEventAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("manager");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    title: formData.get("title") as string,
    event_date: (formData.get("event_date") as string) || undefined,
    capacity: formData.get("capacity")
      ? Number(formData.get("capacity"))
      : undefined,
    event_type:
      (formData.get("event_type") as string) || undefined,
    entry_fee: formData.get("entry_fee")
      ? Number(formData.get("entry_fee"))
      : undefined,
  };

  const parsed = eventCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    // 3. イベント作成
    const event = await createEvent({
      storeId: ctx.storeId,
      title: parsed.data.title,
      description: parsed.data.event_date ? undefined : undefined,
      eventDate: parsed.data.event_date || undefined,
      capacity: parsed.data.capacity,
      eventType: parsed.data.event_type,
      entryFee: parsed.data.entry_fee,
    });

    // 4. 監査ログ
    await writeAuditLog({
      ctx,
      action: "event.create",
      targetTable: "events",
      targetId: event.id,
      after: {
        title: parsed.data.title,
        event_date: parsed.data.event_date,
        capacity: parsed.data.capacity,
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (e) {
    console.error("createEvent error:", e);
    return { error: "イベントの作成に失敗しました" };
  }
}

export async function registerForEventAction(formData: FormData) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("staff");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const raw = {
    event_id: formData.get("event_id") as string,
    customer_id: formData.get("customer_id") as string,
  };

  const parsed = eventEntrySchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();

    // 3. イベントの店舗所属・定員チェック
    const { data: event } = await supabase
      .from("events")
      .select("id, store_id, capacity")
      .eq("id", parsed.data.event_id)
      .single();

    if (!event || event.store_id !== ctx.storeId) {
      return { error: "イベントが見つかりません" };
    }

    if (event.capacity) {
      const { count } = await supabase
        .from("event_entries")
        .select("id", { count: "exact", head: true })
        .eq("event_id", parsed.data.event_id);

      if (count !== null && count >= event.capacity) {
        return { error: "定員に達しています" };
      }
    }

    // 4. 顧客の店舗所属チェック
    const { data: customer } = await supabase
      .from("customers")
      .select("id, store_id")
      .eq("id", parsed.data.customer_id)
      .single();

    if (!customer || customer.store_id !== ctx.storeId) {
      return { error: "顧客が見つかりません" };
    }

    // 5. エントリー作成
    const entry = await createEventEntry({
      eventId: parsed.data.event_id,
      customerId: parsed.data.customer_id,
    });

    // 6. 監査ログ
    await writeAuditLog({
      ctx,
      action: "event.register",
      targetTable: "event_entries",
      targetId: entry.id,
      after: {
        event_id: parsed.data.event_id,
        customer_id: parsed.data.customer_id,
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (e) {
    console.error("registerForEvent error:", e);
    return { error: "イベント登録に失敗しました" };
  }
}

export async function recordEventResultAction(input: {
  event_id: string;
  customer_id: string;
  ranking?: number;
  points?: number;
}) {
  // 1. 認証・権限チェック
  let ctx;
  try {
    ctx = await requireRole("manager");
  } catch {
    return { error: "権限がありません" };
  }

  // 2. 入力値検証
  const schema = z.object({
    event_id: z.string().uuid("不正なIDです"),
    customer_id: z.string().uuid("不正なIDです"),
    ranking: z.number().int().min(1).optional(),
    points: z.number().int().min(0).optional(),
  });

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createClient();

    // 3. イベントの店舗所属チェック
    const { data: event } = await supabase
      .from("events")
      .select("id, store_id")
      .eq("id", parsed.data.event_id)
      .single();

    if (!event || event.store_id !== ctx.storeId) {
      return { error: "イベントが見つかりません" };
    }

    // 4. 結果記録
    const result = await createEventResult({
      eventId: parsed.data.event_id,
      customerId: parsed.data.customer_id,
      ranking: parsed.data.ranking,
      pointsAwarded: parsed.data.points,
      createdBy: ctx.userId,
    });

    // 5. 監査ログ
    await writeAuditLog({
      ctx,
      action: "event.result",
      targetTable: "event_results",
      targetId: result.id,
      after: {
        event_id: parsed.data.event_id,
        customer_id: parsed.data.customer_id,
        ranking: parsed.data.ranking,
        points: parsed.data.points,
      },
    });

    revalidatePath("/events");
    return { success: true };
  } catch (e) {
    console.error("recordEventResult error:", e);
    return { error: "イベント結果の記録に失敗しました" };
  }
}
