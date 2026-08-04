import { PasswordRecoveryForm } from "../../../features/authentication";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

export const PasswordRecoveryPage = () => {
  const { t } = useLanguage();
  return <div className="app-shell">
    <header className="app-header"><a className="brand" href="/">Moviqo</a><LanguageSelector /></header>
    <main className="app-main"><section className="page-heading" aria-labelledby="password-recovery-title">
      <p className="eyebrow">{t("passwordRecovery.eyebrow")}</p>
      <h1 id="password-recovery-title">{t("passwordRecovery.title")}</h1>
      <p className="lede">{t("passwordRecovery.lede")}</p>
    </section><PasswordRecoveryForm /></main>
  </div>;
};
