import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_AUTH_COOKIE_OPTIONS } from "@/lib/supabase/config";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  const protectedRoutes = ["/favoris", "/dashboard-client"];
  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAdmin = pathname.startsWith("/dashboard") && !pathname.startsWith("/dashboard-client");

  if ((isProtected || isAdmin) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdmin && user) {
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

    if (!hasAdminRole) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
