import { useEffect, useState } from "react";
import { PasswordResetForm } from "../../../features/authentication/ui/PasswordResetForm";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

export const PasswordResetPage = () => {
  const { t } = useLanguage();
  const [token] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? ""
  );
  useEffect(() => {
    if (typeof window === "undefined" || !window.location.search.includes("token=")) return;
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);
  return <div className="app-shell">
    <header className="app-header"><a className="brand" href="/">Moviqo</a><LanguageSelector /></header>
    <main className="app-main"><section className="page-heading" aria-labelledby="password-reset-title">
      <p className="eyebrow">{t("passwordRecovery.eyebrow")}</p>
      <h1 id="password-reset-title">{t("passwordRecovery.resetTitle")}</h1>
      <p className="lede">{t("passwordRecovery.resetLede")}</p>
    </section><PasswordResetForm token={token} /></main>
  </div>;
};
