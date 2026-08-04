import { AuthorityPreview } from "../../../features/authority-preview";
import { useSession } from "../../../features/authentication";
import { Button } from "../../../shared/ui/Button";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

export const HomePage = () => {
  const { t } = useLanguage();
  const { state, signOutCurrentSession } = useSession();

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label={t("app.brand.home")}>
          Moviqo
        </a>
        <nav className="app-nav" aria-label={t("app.nav.primary")}>
          <a href="#work">{t("app.nav.work")}</a>
          <a href="#processes">{t("app.nav.processes")}</a>
          <a href="#admin">{t("app.nav.admin")}</a>
          <a href="/design-system">{t("app.nav.designSystem")}</a>
        </nav>
        <LanguageSelector />
        {state.status === "authenticated" ? (
          <button type="button" onClick={() => void signOutCurrentSession()}>{t("auth.signOut")}</button>
        ) : (
          <a href="/sign-in">{t("auth.signIn")}</a>
        )}
      </header>
      <main className="app-main">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h1 id="page-title">{t("home.title")}</h1>
          <p className="lede">{t("home.lede")}</p>
          <div className="button-row">
            <Button type="button" onClick={() => window.location.assign("/register")}>
              {t("home.cta.register")}
            </Button>
          </div>
        </section>
        <AuthorityPreview />
      </main>
    </div>
  );
};
