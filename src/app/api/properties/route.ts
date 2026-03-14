import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  let query = supabase
    .from("properties")
    .select("*, property_images(*)")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  const status = searchParams.get("status");
  const listing_type = searchParams.get("listing_type");
  const property_type = searchParams.get("property_type");
  const city = searchParams.get("city");
  const featured = searchParams.get("featured");

  if (status) query = query.eq("status", status);
  else query = query.eq("status", "publie");

  if (listing_type) query = query.eq("listing_type", listing_type);
  if (property_type) query = query.eq("property_type", property_type);
  if (city) query = query.ilike("city", `%${city}%`);
  if (featured === "true") query = query.eq("is_featured", true);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await request.json();
  const slug = generateSlug(body.title) + "-" + Date.now();

  const { data, error } = await supabase
    .from("properties")
    .insert({ ...body, slug, created_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
