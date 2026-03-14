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
  const rental_category = searchParams.get("rental_category");
  const rent_payment_period = searchParams.get("rent_payment_period");
  const property_type = searchParams.get("property_type");
  const city = searchParams.get("city");
  const featured = searchParams.get("featured");

  if (status) query = query.eq("status", status);
  else query = query.eq("status", "publie");

  if (rental_category) {
    query = query.eq("listing_type", "location");
  } else if (listing_type) {
    query = query.eq("listing_type", listing_type);
  }

  if (rental_category) {
    switch (rental_category) {
      case "chambre_meublee":
        query = query
          .eq("is_furnished", true)
          .or("rental_category.eq.chambre_meublee,title.ilike.%chambre meubl%,description.ilike.%chambre meubl%,title.ilike.%meubl%,description.ilike.%meubl%");
        break;
      case "studio":
        query = query.or("rental_category.eq.studio,title.ilike.%studio%,description.ilike.%studio%");
        break;
      case "appartement":
        query = query.eq("property_type", "appartement").or("rental_category.eq.appartement");
        break;
      case "mini_studio":
        query = query.or("rental_category.eq.mini_studio,title.ilike.%mini%studio%,description.ilike.%mini%studio%,title.ilike.%ministudio%,description.ilike.%ministudio%");
        break;
      case "colocation":
        query = query.or("rental_category.eq.colocation,title.ilike.%colocation%,description.ilike.%colocation%,title.ilike.%co-location%,description.ilike.%co-location%");
        break;
      default:
        break;
    }
  }
  if (rent_payment_period) query = query.eq("rent_payment_period", rent_payment_period);

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
