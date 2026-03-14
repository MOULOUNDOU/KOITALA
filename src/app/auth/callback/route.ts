import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If a specific redirect was requested, use it
      if (next && next !== "/") {
        return NextResponse.redirect(new URL(next, request.url));
      }

      // Otherwise redirect based on user role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role === "admin") {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        }
      }
      return NextResponse.redirect(new URL("/dashboard-client", request.url));
    }
  }

  return NextResponse.redirect(new URL("/auth/login?error=oauth", request.url));
}
