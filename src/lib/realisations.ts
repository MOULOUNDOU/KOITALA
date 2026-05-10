import { createClient } from "@/lib/supabase/server";
import type { Realisation } from "@/types";

export async function getPublishedRealisations(limit?: number): Promise<Realisation[]> {
  const supabase = await createClient();

  let query = supabase
    .from("realisations")
    .select("*")
    .eq("status", "publie")
    .order("sort_order", { ascending: true })
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (limit && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Unable to fetch realisations", error.message);
    return [];
  }

  return (data as Realisation[] | null) ?? [];
}
