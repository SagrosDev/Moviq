import { RegistrationForm } from "../../../features/registration";
import { useLanguage } from "../../../shared/localization";
import { Card } from "../../../shared/ui";
import { PublicPageShell } from "../../../widgets/public-page-shell";

export const RegistrationPage = () => {
  const { t } = useLanguage();

  return (
    <PublicPageShell
      description={t("registration.lede")}
      eyebrow={t("registration.eyebrow")}
      pageName="registration"
      size="default"
      title={t("registration.title")}
      titleId="registration-title"
    >
      <Card labelledBy="registration-form-title">
        <div className="grid gap-moviqo-2">
          <h2 className="m-0 text-moviqo-heading font-semibold" id="registration-form-title">
            {t("registration.form.title")}
          </h2>
          <p className="m-0 text-moviqo-ink-secondary">{t("registration.form.body")}</p>
        </div>
        <RegistrationForm />
      </Card>
    </PublicPageShell>
  );
};
