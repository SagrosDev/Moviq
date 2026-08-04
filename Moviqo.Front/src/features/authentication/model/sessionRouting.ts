export const protectedEntryPath = "/my-work";

export const isProtectedPath = (pathname: string) => {
  return pathname === protectedEntryPath || pathname.startsWith(`${protectedEntryPath}/`);
};

export const resolveProtectedRedirectPath = (pathname: string) => {
  return isProtectedPath(pathname) ? "/sign-in" : null;
};
