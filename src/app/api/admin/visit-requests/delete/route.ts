import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function resolveAdminAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { authorized: false, status: 401 as const };
  }

  let hasAdminRole = false;
  const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc("is_admin");
  if (!rpcError && typeof rpcIsAdmin === "boolean") {
    hasAdminRole = rpcIsAdmin;
  }

  if (!hasAdminRole) {
    const { data: profileById } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileById?.role === "admin") {
      hasAdminRole = true;
    } else if (user.email) {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("role")
        .eq("email", user.email)
        .maybeSingle();

      hasAdminRole = profileByEmail?.role === "admin";
    }
  }

  return {
    authorized: hasAdminRole,
    status: hasAdminRole ? 200 : 403,
  };
}

export async function POST(request: Request) {
  const adminAccess = await resolveAdminAccess();
  if (!adminAccess.authorized) {
    return NextResponse.json(
      {
        error:
          adminAccess.status === 401
            ? "Authentification requise."
            : "Action reservee aux administrateurs.",
      },
      { status: adminAccess.status }
    );
  }

  const rawBody = (await request.json().catch(() => null)) as unknown;
  const rawVisitId =
    rawBody && typeof rawBody === "object" ? Reflect.get(rawBody, "visitId") : undefined;

  if (typeof rawVisitId !== "string") {
    return NextResponse.json({ error: "Identifiant de demande manquant." }, { status: 400 });
  }

  const visitId = rawVisitId.trim();
  if (!UUID_REGEX.test(visitId)) {
    return NextResponse.json({ error: "Identifiant de demande invalide." }, { status: 400 });
  }

  const adminSupabase = await createAdminClient();
  const { data, error } = await adminSupabase
    .from("visit_requests")
    .delete()
    .eq("id", visitId)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Suppression impossible pour le moment." }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });
  }

  return NextResponse.json({ message: "Demande supprimee avec succes." }, { status: 200 });
}
