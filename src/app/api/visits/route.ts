import { NextRequest, NextResponse } from "next/server";
import { AGENCY_INFO } from "@/lib/agency";
import { buildPropertyLinkFromSlug, sendVisitNotifications } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";
import { visitRequestSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const propertyId =
      typeof body.property_id === "string" && body.property_id.trim().length > 0
        ? body.property_id.trim()
        : "";
    const parsed = visitRequestSchema.safeParse(body);

    if (!propertyId || !parsed.success) {
      return NextResponse.json(
        {
          error: propertyId
            ? parsed.error?.issues[0]?.message ?? "Champs requis manquants"
            : "Le bien selectionne est requis",
        },
        { status: 400 }
      );
    }

    const { full_name, email, phone, message, preferred_date } = parsed.data;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: property } = await supabase
      .from("properties")
      .select("title, slug")
      .eq("id", propertyId)
      .maybeSingle();

    const { error } = await supabase.from("visit_requests").insert({
      property_id: propertyId,
      user_id: user?.id ?? null,
      full_name,
      email,
      phone: phone ?? null,
      message: message ?? null,
      preferred_date: preferred_date ?? null,
      status: "en_attente",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      await sendVisitNotifications({
        fullName: full_name,
        email,
        phone,
        message,
        preferredDate: preferred_date,
        propertyTitle: property?.title ?? null,
        propertyUrl: buildPropertyLinkFromSlug(property?.slug, request),
      });
    } catch (notificationError) {
      console.error("Erreur Resend visite:", notificationError);
    }

    return NextResponse.json(
      {
        success: true,
        notification_target: process.env.CONTACT_NOTIFICATION_EMAIL?.trim() || AGENCY_INFO.email,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("visit_requests")
    .select("*, property:properties(title, slug)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
