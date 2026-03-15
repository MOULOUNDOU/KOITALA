import { createClient } from "@/lib/supabase/server";
import type { Property } from "@/types";

export async function getFeaturedProperties(
  page: number,
  pageSize: number
): Promise<{ properties: Property[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("properties")
    .select("*, property_images(*)", { count: "exact" })
    .eq("status", "publie")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  return { properties: data ?? [], total: count ?? 0 };
}

export async function getRecentProperties(limit: number): Promise<Property[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("properties")
    .select("*, property_images(*)")
    .eq("status", "publie")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit);

  return data ?? [];
}

export async function getRecentPropertiesPage(
  page: number,
  pageSize: number
): Promise<{ properties: Property[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count } = await supabase
    .from("properties")
    .select("*, property_images(*)", { count: "exact" })
    .eq("status", "publie")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, to);

  return { properties: data ?? [], total: count ?? 0 };
}
