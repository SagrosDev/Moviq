import { useLanguage } from "../../../shared/localization";

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
      <section className="status-panel" aria-labelledby="verification-status-title">
        <h2 id="verification-status-title">{t("verification.success.title")}</h2>
        <p>
          {t("verification.success.body")} <strong>{state.email}</strong>.
        </p>
        <p>{t("verification.success.next")}</p>
        <div className="button-row">
          <a className="button" href="/sign-in">
            {t("signIn.submit")}
          </a>
          <a className="button" data-variant="secondary" href="/">
            {t("verification.cta.home")}
          </a>
        </div>
      </section>
    );
  }

  if (state.kind === "invalid") {
    return (
      <section className="status-panel" aria-labelledby="verification-status-title">
        <h2 id="verification-status-title">{t("verification.invalid.title")}</h2>
        <p>{t("verification.invalid.body")}</p>
        <div className="button-row">
          <a className="button" href="/register">
            {t("verification.cta.register")}
          </a>
          <a className="button" data-variant="secondary" href="/">
            {t("verification.cta.home")}
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="status-panel" aria-labelledby="verification-status-title">
      <h2 id="verification-status-title">{t("verification.loading.title")}</h2>
      <p>{t("verification.loading.body")}</p>
    </section>
  );
};
