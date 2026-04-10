export function getDefaultPostAuthPath(isAdmin: boolean): string {
  return isAdmin ? "/dashboard" : "/auth/login?error=admin_only";
}

function isAuthPath(path: string): boolean {
  return path.startsWith("/auth");
}

export function resolvePostAuthPath(
  requestedPath: string | null | undefined,
  isAdmin: boolean
): string {
  if (!isAdmin) {
    return "/auth/login?error=admin_only";
  }

  const normalizedPath = requestedPath?.trim() || "/";
  const defaultPath = getDefaultPostAuthPath(isAdmin);

  if (normalizedPath === "/" || isAuthPath(normalizedPath)) {
    return defaultPath;
  }

  return normalizedPath;
}
