import { createClient } from "@/lib/supabase/server";
import type { EventRecord, EventEntry, EventResultLog } from "@/types/database";

export async function getEvents(storeId: string): Promise<EventRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("store_id", storeId)
    .order("event_date", { ascending: false });
  if (error) throw error;
  return (data as EventRecord[]) ?? [];
}

export async function getEventById(id: string): Promise<EventRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as EventRecord;
}

export async function createEvent(input: {
  storeId: string;
  title: string;
  description?: string;
  eventDate?: string;
  capacity?: number;
  eventType?: string;
  entryFee?: number;
}): Promise<EventRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .insert({
      store_id: input.storeId,
      title: input.title,
      description: input.description || null,
      event_date: input.eventDate || null,
      capacity: input.capacity || null,
      event_type: input.eventType || null,
      entry_fee: input.entryFee || 0,
      status: "draft",
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventRecord;
}

export async function getEventEntries(eventId: string): Promise<EventEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_entries")
    .select("*, customer:customers(name)")
    .eq("event_id", eventId)
    .order("created_at");
  if (error) throw error;
  return (data as EventEntry[]) ?? [];
}

export async function createEventEntry(input: {
  eventId: string;
  customerId: string;
}): Promise<EventEntry> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_entries")
    .insert({
      event_id: input.eventId,
      customer_id: input.customerId,
      status: "reserved",
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventEntry;
}

export async function getEventResults(eventId: string): Promise<EventResultLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_result_logs")
    .select("*")
    .eq("event_id", eventId)
    .order("ranking");
  if (error) throw error;
  return (data as EventResultLog[]) ?? [];
}

export async function createEventResult(input: {
  eventId: string;
  customerId: string;
  ranking?: number;
  prizeName?: string;
  pointsAwarded?: number;
  notes?: string;
  createdBy: string;
}): Promise<EventResultLog> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_result_logs")
    .insert({
      event_id: input.eventId,
      customer_id: input.customerId,
      ranking: input.ranking || null,
      prize_name: input.prizeName || null,
      points_awarded: input.pointsAwarded || 0,
      notes: input.notes || null,
      created_by: input.createdBy,
    })
    .select()
    .single();
  if (error) throw error;
  return data as EventResultLog;
}
