import { NextRequest, NextResponse } from "next/server";
import { AGENCY_INFO } from "@/lib/agency";
import { sendContactNotifications, buildPropertyLinkFromSlug } from "@/lib/resend";
import { createClient } from "@/lib/supabase/server";
import { contactSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const propertyId =
      typeof body.property_id === "string" && body.property_id.trim().length > 0
        ? body.property_id.trim()
        : null;
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Champs requis manquants" },
        { status: 400 }
      );
    }

    const { full_name, email, phone, subject, message } = parsed.data;

    const supabase = await createClient();
    const { data: property } = propertyId
      ? await supabase
          .from("properties")
          .select("title, slug")
          .eq("id", propertyId)
          .maybeSingle()
      : { data: null };

    const { error } = await supabase.from("contacts").insert({
      property_id: propertyId,
      full_name,
      email,
      phone: phone ?? null,
      subject: subject ?? null,
      message,
      status: "nouveau",
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      await sendContactNotifications({
        fullName: full_name,
        email,
        phone,
        subject,
        message,
        propertyTitle: property?.title ?? null,
        propertyUrl: buildPropertyLinkFromSlug(property?.slug, request),
      });
    } catch (notificationError) {
      console.error("Erreur Resend contact:", notificationError);
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
    .from("contacts")
    .select("*, property:properties(title)")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
