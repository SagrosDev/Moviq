import { RegistrationForm } from "../../../features/registration";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

export const RegistrationPage = () => {
  const { t } = useLanguage();

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label={t("app.brand.home")}>
          Moviqo
        </a>
        <nav className="app-nav" aria-label={t("app.nav.primary")}>
          <a href="/">{t("app.nav.work")}</a>
          <a href="/#processes">{t("app.nav.processes")}</a>
          <a href="/#admin">{t("app.nav.admin")}</a>
          <a href="/design-system">{t("app.nav.designSystem")}</a>
        </nav>
        <LanguageSelector />
      </header>
      <main className="app-main">
        <section className="page-heading" aria-labelledby="registration-title">
          <p className="eyebrow">{t("registration.eyebrow")}</p>
          <h1 id="registration-title">{t("registration.title")}</h1>
          <p className="lede">{t("registration.lede")}</p>
        </section>
        <section className="status-panel" aria-labelledby="registration-form-title">
          <h2 id="registration-form-title">{t("registration.form.title")}</h2>
          <p>{t("registration.form.body")}</p>
          <RegistrationForm />
        </section>
      </main>
    </div>
  );
};
