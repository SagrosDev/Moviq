import { useEffect, useState } from "react";
import { PasswordResetForm } from "../../../features/authentication";
import { useLanguage } from "../../../shared/localization";
import { Card } from "../../../shared/ui";
import { PublicPageShell } from "../../../widgets/public-page-shell";

export const PasswordResetPage = () => {
  const { t } = useLanguage();
  const [token] = useState(() =>
    typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("token") ?? ""
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.location.search.includes("token=")) {
      return;
    }

    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  return (
    <PublicPageShell
      description={t("passwordRecovery.resetLede")}
      eyebrow={t("passwordRecovery.eyebrow")}
      pageName="password-reset"
      title={t("passwordRecovery.resetTitle")}
      titleId="password-reset-title"
    >
      <Card>
        <PasswordResetForm token={token} />
      </Card>
    </PublicPageShell>
  );
};
