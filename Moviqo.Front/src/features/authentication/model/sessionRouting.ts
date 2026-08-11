export const protectedEntryPath = "/my-work";

export const isProtectedPath = (pathname: string) => {
  return ["/my-work", "/processes", "/workflows", "/forms"].some(
    (root) => pathname === root || pathname.startsWith(`${root}/`)
  );
};

export const resolveProtectedRedirectPath = (pathname: string) => {
  return isProtectedPath(pathname) ? "/sign-in" : null;
};

export const resolveProtectedReturnDestination = (state: unknown) => {
  const from = typeof state === "object" && state !== null && "from" in state
    ? (state as { from?: unknown }).from
    : undefined;
  if (
    typeof from !== "string"
    || !from.startsWith("/")
    || from.startsWith("//")
    || from.includes("\\")
  ) {
    return protectedEntryPath;
  }

  try {
    const destination = new URL(from, "https://moviqo.local");
    if (
      destination.origin !== "https://moviqo.local"
      || !isProtectedPath(destination.pathname)
    ) {
      return protectedEntryPath;
    }
    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return protectedEntryPath;
  }
};
