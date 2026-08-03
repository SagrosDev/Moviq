import { AuthorityPreview } from "../../../features/authority-preview";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

export const HomePage = () => {
  const { t } = useLanguage();

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
      </header>
      <main className="app-main">
        <section className="hero" aria-labelledby="page-title">
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h1 id="page-title">{t("home.title")}</h1>
          <p className="lede">{t("home.lede")}</p>
        </section>
        <AuthorityPreview />
      </main>
    </div>
  );
};
