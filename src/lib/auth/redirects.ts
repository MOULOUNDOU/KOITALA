export function getDefaultPostAuthPath(isAdmin: boolean): string {
  return isAdmin ? "/dashboard" : "/dashboard-client";
}

function isAuthPath(path: string): boolean {
  return path.startsWith("/auth");
}

function isClientAreaPath(path: string): boolean {
  return path.startsWith("/dashboard-client") || path.startsWith("/favoris");
}

function isAdminAreaPath(path: string): boolean {
  return path.startsWith("/dashboard") && !path.startsWith("/dashboard-client");
}

export function resolvePostAuthPath(
  requestedPath: string | null | undefined,
  isAdmin: boolean
): string {
  const normalizedPath = requestedPath?.trim() || "/";
  const defaultPath = getDefaultPostAuthPath(isAdmin);

  if (normalizedPath === "/" || isAuthPath(normalizedPath)) {
    return defaultPath;
  }

  if (isAdmin && isClientAreaPath(normalizedPath)) {
    return "/dashboard";
  }

  if (!isAdmin && isAdminAreaPath(normalizedPath)) {
    return "/dashboard-client";
  }

  return normalizedPath;
}
