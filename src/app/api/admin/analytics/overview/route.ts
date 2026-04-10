import { NextResponse } from "next/server";
import { getAdminAnalyticsOverview } from "@/lib/analytics/adminAnalytics";
import { createAdminClient, createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_PERIODS = new Set([7, 30, 90]);

function getSafePeriod(value: string | null): 7 | 30 | 90 {
  const parsed = Number(value);
  if (ALLOWED_PERIODS.has(parsed)) {
    return parsed as 7 | 30 | 90;
  }
  return 30;
}

async function resolveAdminAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { authorized: false, status: 401 as const };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { authorized: false, status: 500 as const };
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
  };
}

export async function GET(request: Request) {
  const adminAccess = await resolveAdminAccess();

  if (!adminAccess.authorized) {
    return NextResponse.json(
      {
        error:
          adminAccess.status === 401
            ? "Authentification requise."
            : adminAccess.status === 500
              ? "Configuration serveur incomplète pour l'analyse."
              : "Action reservee aux administrateurs.",
      },
      { status: adminAccess.status }
    );
  }

  const { searchParams } = new URL(request.url);
  const period = getSafePeriod(searchParams.get("period"));

  const analytics = await getAdminAnalyticsOverview(period);
  return NextResponse.json(analytics, { status: 200 });
}
