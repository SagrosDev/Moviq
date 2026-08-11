import { useEffect, useRef } from "react";
import { Navigate, Outlet, useLocation, useNavigate, useRouteError } from "react-router";
import {
  isProtectedPath,
  protectedEntryPath,
  useSession
} from "../../features/authentication";
import { MoviqoMark, MoviqoWordmark } from "../../shared/branding";
import { LanguageSelector, useLanguage } from "../../shared/localization";
import {
  Alert,
  AppHeader,
  AppShell,
  Button,
  ButtonLink,
  PageContainer,
  PageHeader
} from "../../shared/ui";
import { EnvironmentBanner } from "../ui/EnvironmentBanner";
import {
  authenticatedNavigationForRole,
  authenticatedPageTitleKey
} from "./navigation";

export const PublicLayout = () => {
  const location = useLocation();
  return (
    <>
      {location.pathname === "/design-system" ? null : <EnvironmentBanner />}
      <Outlet />
    </>
  );
};

export const AuthenticatedLayout = () => {
  const { t } = useLanguage();
  const { state } = useSession();
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);
  const previousPathname = useRef(location.pathname);

  useEffect(() => {
    document.title = `${t(authenticatedPageTitleKey(location.pathname))} | Moviqo`;
    if (previousPathname.current !== location.pathname) {
      mainRef.current?.focus();
      previousPathname.current = location.pathname;
    }
  }, [location.pathname, t]);

  if (state.status === "loading") {
    return (
      <AppShell>
        <EnvironmentBanner />
        <main id="main-content">
          <PageContainer>
            <Alert announcement="polite">{t("app.loading")}</Alert>
          </PageContainer>
        </main>
      </AppShell>
    );
  }

  if (state.status === "anonymous") {
    return <Navigate
      replace
      state={{ from: `${location.pathname}${location.search}${location.hash}` }}
      to="/sign-in"
    />;
  }

  const navigation = authenticatedNavigationForRole(
    state.context.membership.role,
    location.pathname
  ).map((item) => ({
    href: item.href,
    label: t(item.labelKey),
    current: item.current
  }));

  const navigateWithinApplication = (
    href: string,
    event: React.MouseEvent<HTMLAnchorElement>
  ) => {
    if (
      event.button === 0
      && !event.metaKey
      && !event.ctrlKey
      && !event.shiftKey
      && !event.altKey
    ) {
      event.preventDefault();
      navigate(href);
    }
  };

  return (
    <AppShell>
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-moviqo-2 focus:rounded-moviqo-control focus:bg-moviqo-surface-raised focus:p-moviqo-3"
        href="#main-content"
      >
        {t("app.skipToContent")}
      </a>
      <EnvironmentBanner />
      <AppHeader
        actions={(
          <>
            <LanguageSelector />
            <Button variant="secondary" onClick={() => navigate("/sign-out")}>
              {t("auth.signOut")}
            </Button>
          </>
        )}
        brandHomeLabel={t("app.brand.home")}
        brandHref={protectedEntryPath}
        brandLabel={<MoviqoWordmark />}
        brandMark={<MoviqoMark />}
        navigation={navigation}
        navigationLabel={t("app.nav.primary")}
        onNavigate={navigateWithinApplication}
        size="wide"
      />
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        <PageContainer size="wide">
          <Outlet />
        </PageContainer>
      </main>
    </AppShell>
  );
};

export const SignOutRoute = () => {
  const { t } = useLanguage();
  const { signOutCurrentSession } = useSession();
  const signOutStarted = useRef(false);

  useEffect(() => {
    if (signOutStarted.current) return;
    signOutStarted.current = true;
    void signOutCurrentSession().catch(() => {
      signOutStarted.current = false;
    });
  }, [signOutCurrentSession]);

  return <Alert announcement="polite">{t("app.loading")}</Alert>;
};

export const PublicHomeRoute = ({ page }: { page: React.ReactNode }) => {
  const { state } = useSession();
  return state.status === "authenticated"
    ? <Navigate replace to={protectedEntryPath} />
    : <>{page}</>;
};

export const NotFoundPage = () => {
  const { t } = useLanguage();
  const { state } = useSession();
  const destination = state.status === "authenticated" ? protectedEntryPath : "/";

  return (
    <PageContainer size="compact">
      <div className="grid gap-moviqo-5 py-moviqo-6">
        <PageHeader
          description={t("route.notFound.body")}
          title={t("route.notFound.title")}
        />
        <ButtonLink href={destination} variant="secondary">
          {t("route.notFound.back")}
        </ButtonLink>
      </div>
    </PageContainer>
  );
};

export const RouteErrorPage = () => {
  const { t } = useLanguage();
  const location = useLocation();
  useRouteError();
  const destination = isProtectedPath(location.pathname) ? protectedEntryPath : "/";
  return (
    <PageContainer size="compact">
      <div className="grid gap-moviqo-5 py-moviqo-6">
        <PageHeader
          description={t("route.error.body")}
          title={t("route.error.title")}
        />
        <ButtonLink href={destination} variant="secondary">
          {t("route.notFound.back")}
        </ButtonLink>
      </div>
    </PageContainer>
  );
};
