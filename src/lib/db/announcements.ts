import { createClient } from "@/lib/supabase/server";
import type { Announcement } from "@/types/database";

export async function getAnnouncements(
  storeId: string,
  target?: string
): Promise<Announcement[]> {
  const supabase = await createClient();
  let query = supabase
    .from("announcements")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (target) {
    query = query.or(`target.eq.${target},target.eq.all`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Announcement[]) ?? [];
}

export async function createAnnouncement(input: {
  storeId: string;
  title: string;
  body?: string;
  target: string;
}): Promise<Announcement> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      store_id: input.storeId,
      title: input.title,
      body: input.body || null,
      target: input.target,
      published_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as Announcement;
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);
  if (error) throw error;
}
