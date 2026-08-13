import { useLanguage } from "../../../shared/localization";
import { ActionBar, Alert, ButtonLink, Card, LoadingState } from "../../../shared/ui";

export type VerificationViewState =
  | { kind: "loading" }
  | { kind: "success"; email: string }
  | { kind: "invalid" };

type VerificationStatusPanelProps = {
  state: VerificationViewState;
};

export const VerificationStatusPanel = ({
  state
}: VerificationStatusPanelProps) => {
  const { t } = useLanguage();

  if (state.kind === "success") {
    return (
      <Card labelledBy="verification-status-title">
        <h2 className="m-0 text-moviqo-heading font-semibold" id="verification-status-title">
          {t("verification.success.title")}
        </h2>
        <Alert announcement="polite" tone="success">
          {t("verification.success.body")} <strong>{state.email}</strong>.
        </Alert>
        <p className="m-0 text-moviqo-ink-secondary">{t("verification.success.next")}</p>
        <ActionBar align="start">
          <ButtonLink href="/sign-in">{t("signIn.submit")}</ButtonLink>
          <ButtonLink href="/" variant="secondary">{t("verification.cta.home")}</ButtonLink>
        </ActionBar>
      </Card>
    );
  }

  if (state.kind === "invalid") {
    return (
      <Card labelledBy="verification-status-title">
        <h2 className="m-0 text-moviqo-heading font-semibold" id="verification-status-title">
          {t("verification.invalid.title")}
        </h2>
        <Alert announcement="assertive" tone="error">{t("verification.invalid.body")}</Alert>
        <ActionBar align="start">
          <ButtonLink href="/register">{t("verification.cta.register")}</ButtonLink>
          <ButtonLink href="/" variant="secondary">{t("verification.cta.home")}</ButtonLink>
        </ActionBar>
      </Card>
    );
  }

  return (
    <Card labelledBy="verification-status-title">
      <h2 className="m-0 text-moviqo-heading font-semibold" id="verification-status-title">
        {t("verification.loading.title")}
      </h2>
      <LoadingState>{t("verification.loading.body")}</LoadingState>
    </Card>
  );
};
