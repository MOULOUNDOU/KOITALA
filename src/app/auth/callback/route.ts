import { createClient } from "@/lib/supabase/server";
import { resolvePostAuthPath } from "@/lib/auth/redirects";
import { NextResponse } from "next/server";

function getSafeNextPath(rawNext: string | null): string | null {
  if (!rawNext) return null;
  if (rawNext.startsWith("/")) return rawNext;

  try {
    const parsed = new URL(rawNext);
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = getSafeNextPath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      let isAdmin = false;

      const { data: rpcIsAdmin, error: rpcError } = await supabase.rpc("is_admin");
      if (!rpcError && typeof rpcIsAdmin === "boolean") {
        isAdmin = rpcIsAdmin;
      }

      if (!isAdmin) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileById } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle();

          if (profileById?.role === "admin") {
            isAdmin = true;
          } else if (user.email) {
            const { data: profileByEmail } = await supabase
              .from("profiles")
              .select("role")
              .eq("email", user.email)
              .maybeSingle();
            isAdmin = profileByEmail?.role === "admin";
          }
        }
      }

      return NextResponse.redirect(new URL(resolvePostAuthPath(next, isAdmin), request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=oauth", request.url));
}
