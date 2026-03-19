import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface AdminAccessResult {
  authorized: boolean;
  status: number;
  userId?: string;
}

async function resolveAdminAccess(): Promise<AdminAccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { authorized: false, status: 401 };
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
    userId: user.id,
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
  const rawUserId =
    rawBody && typeof rawBody === "object" ? Reflect.get(rawBody, "userId") : undefined;

  if (typeof rawUserId !== "string") {
    return NextResponse.json({ error: "Identifiant utilisateur manquant." }, { status: 400 });
  }

  const userId = rawUserId.trim();
  if (!UUID_REGEX.test(userId)) {
    return NextResponse.json({ error: "Identifiant utilisateur invalide." }, { status: 400 });
  }

  if (userId === adminAccess.userId) {
    return NextResponse.json(
      { error: "Suppression de votre propre compte non autorisee." },
      { status: 400 }
    );
  }

  const adminSupabase = await createAdminClient();
  const { error } = await adminSupabase.auth.admin.deleteUser(userId);

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("not found")) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    return NextResponse.json({ error: "Suppression impossible pour le moment." }, { status: 500 });
  }

  return NextResponse.json({ message: "Utilisateur supprime avec succes." }, { status: 200 });
}
