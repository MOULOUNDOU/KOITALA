import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // Always redirect even if signout fails server-side.
  }

  return NextResponse.redirect(new URL("/", request.url));
}
