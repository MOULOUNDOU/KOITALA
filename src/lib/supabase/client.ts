import { createBrowserClient } from "@supabase/ssr";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  SUPABASE_AUTH_COOKIE_OPTIONS,
  SUPABASE_AUTH_LOCAL_STORAGE_KEY,
} from "@/lib/supabase/config";

type SessionSnapshot = Pick<Session, "access_token" | "refresh_token">;

let browserClient: ReturnType<typeof createBrowserClient> | null = null;
let hasSessionPersistence = false;

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredSession(): SessionSnapshot | null {
  if (!canUseLocalStorage()) return null;

  try {
    const rawValue = window.localStorage.getItem(SUPABASE_AUTH_LOCAL_STORAGE_KEY);
    if (!rawValue) return null;

    const parsed = JSON.parse(rawValue) as Partial<SessionSnapshot>;
    if (
      typeof parsed.access_token !== "string" ||
      parsed.access_token.length === 0 ||
      typeof parsed.refresh_token !== "string" ||
      parsed.refresh_token.length === 0
    ) {
      window.localStorage.removeItem(SUPABASE_AUTH_LOCAL_STORAGE_KEY);
      return null;
    }

    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
    };
  } catch {
    window.localStorage.removeItem(SUPABASE_AUTH_LOCAL_STORAGE_KEY);
    return null;
  }
}

function persistSession(session: Session | null) {
  if (!canUseLocalStorage()) return;

  try {
    if (!session) {
      window.localStorage.removeItem(SUPABASE_AUTH_LOCAL_STORAGE_KEY);
      return;
    }

    const snapshot: SessionSnapshot = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    };

    window.localStorage.setItem(SUPABASE_AUTH_LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore browsers where localStorage is unavailable.
  }
}

async function restoreSessionFromLocalStorage(client: ReturnType<typeof createBrowserClient>) {
  const {
    data: { session },
  } = await client.auth.getSession();

  if (session) {
    persistSession(session);
    return;
  }

  const storedSession = readStoredSession();
  if (!storedSession) return;

  const { data, error } = await client.auth.setSession(storedSession);

  if (error) {
    try {
      window.localStorage.removeItem(SUPABASE_AUTH_LOCAL_STORAGE_KEY);
    } catch {
      // Ignore browsers where localStorage is unavailable.
    }
    return;
  }

  persistSession(data.session);
}

function startSessionPersistence(client: ReturnType<typeof createBrowserClient>) {
  if (!canUseLocalStorage() || hasSessionPersistence) return;

  hasSessionPersistence = true;
  void restoreSessionFromLocalStorage(client);

  client.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
    persistSession(session);
  });
}

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
      }
    );
  }

  startSessionPersistence(browserClient);

  return browserClient;
}
