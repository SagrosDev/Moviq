import { PasswordRecoveryForm } from "../../../features/authentication";
import { useLanguage } from "../../../shared/localization";
import { Card } from "../../../shared/ui";
import { PublicPageShell } from "../../../widgets/public-page-shell";

export const PasswordRecoveryPage = () => {
  const { t } = useLanguage();

  return (
    <PublicPageShell
      description={t("passwordRecovery.lede")}
      eyebrow={t("passwordRecovery.eyebrow")}
      pageName="password-recovery"
      title={t("passwordRecovery.title")}
      titleId="password-recovery-title"
    >
      <Card>
        <PasswordRecoveryForm />
      </Card>
    </PublicPageShell>
  );
};
