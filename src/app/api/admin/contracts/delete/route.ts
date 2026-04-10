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
    return { authorized: false, status: 401 as const, adminSupabase: null };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { authorized: false, status: 500 as const, adminSupabase: null };
  }

  const adminSupabase = await createAdminClient();
  let hasAdminRole = false;

  const { data: profileById } = await adminSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileById?.role === "admin") {
    hasAdminRole = true;
  } else if (user.email) {
    const normalizedEmail = user.email.trim().toLowerCase();
    const { data: profileByEmail } = await adminSupabase
      .from("profiles")
      .select("role")
      .eq("email", normalizedEmail)
      .maybeSingle();

    hasAdminRole = profileByEmail?.role === "admin";
  }

  return {
    authorized: hasAdminRole,
    status: hasAdminRole ? 200 : 403,
    adminSupabase: hasAdminRole ? adminSupabase : null,
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
            : adminAccess.status === 500
              ? "Configuration serveur incomplete pour la suppression."
              : "Action reservee aux administrateurs.",
      },
      { status: adminAccess.status }
    );
  }

  const rawBody = (await request.json().catch(() => null)) as unknown;
  const rawContractId =
    rawBody && typeof rawBody === "object" ? Reflect.get(rawBody, "contractId") : undefined;

  if (typeof rawContractId !== "string") {
    return NextResponse.json({ error: "Identifiant de contrat manquant." }, { status: 400 });
  }

  const contractId = rawContractId.trim();
  if (!UUID_REGEX.test(contractId)) {
    return NextResponse.json({ error: "Identifiant de contrat invalide." }, { status: 400 });
  }

  if (!adminAccess.adminSupabase) {
    return NextResponse.json({ error: "Suppression impossible pour le moment." }, { status: 500 });
  }

  const { data: contract, error: contractReadError } = await adminAccess.adminSupabase
    .from("generated_contracts")
    .select("id, storage_path")
    .eq("id", contractId)
    .maybeSingle();

  if (contractReadError) {
    return NextResponse.json({ error: "Suppression impossible pour le moment." }, { status: 500 });
  }

  if (!contract) {
    return NextResponse.json({ error: "Contrat introuvable." }, { status: 404 });
  }

  const { error, count } = await adminAccess.adminSupabase
    .from("generated_contracts")
    .delete({ count: "exact" })
    .eq("id", contractId);

  if (error) {
    return NextResponse.json({ error: "Suppression impossible pour le moment." }, { status: 500 });
  }

  if (!count) {
    return NextResponse.json({ error: "Contrat introuvable." }, { status: 404 });
  }

  let storageWarning = false;
  if (typeof contract.storage_path === "string" && contract.storage_path.trim()) {
    const { error: storageError } = await adminAccess.adminSupabase.storage
      .from("contract-pdfs")
      .remove([contract.storage_path.trim()]);

    if (storageError) {
      storageWarning = true;
    }
  }

  return NextResponse.json(
    {
      message: storageWarning
        ? "Contrat supprime, mais le fichier PDF n'a pas pu etre supprime."
        : "Contrat supprime avec succes.",
      storage_warning: storageWarning,
    },
    { status: 200 }
  );
}
