export const SUPABASE_AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 400 * 24 * 60 * 60,
  secure: process.env.NODE_ENV === "production",
};

export const SUPABASE_AUTH_LOCAL_STORAGE_KEY = "koitala.auth.session";
