import { type FormEvent, useState } from "react";
import { resetPassword } from "../model/passwordRecovery";
import { useLanguage } from "../../../shared/localization";
import { ActionBar, Alert, Button, ButtonLink, PasswordField } from "../../../shared/ui";

export const PasswordResetForm = ({ token }: { token: string }) => {
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await resetPassword({ token, password });
      setPassword("");
      setSubmitted(true);
    } catch {
      setError(t("passwordRecovery.resetFailure"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="grid gap-moviqo-4">
        <Alert announcement="polite" tone="success">{t("passwordRecovery.resetComplete")}</Alert>
        <ButtonLink href="/sign-in">{t("passwordRecovery.signIn")}</ButtonLink>
      </div>
    );
  }

  return (
    <form className="grid gap-moviqo-4" onSubmit={submit} noValidate>
      {error ? <Alert announcement="assertive" tone="error">{error}</Alert> : null}
      <PasswordField
        id="reset-password"
        label={t("passwordRecovery.password")}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        helperText={t("password.policy.helper")}
        revealLabel={t("password.policy.reveal")}
        hideLabel={t("password.policy.hide")}
        isRevealed={isRevealed}
        onRevealToggle={() => setIsRevealed((value) => !value)}
        required
      />
      <ActionBar>
        <Button type="submit" disabled={submitting || !token} width="full">
          {submitting ? t("passwordRecovery.resetting") : t("passwordRecovery.resetSubmit")}
        </Button>
      </ActionBar>
      {(error || !token) ? (
        <ButtonLink href="/password-recovery" variant="quiet">
          {t("passwordRecovery.requestAgain")}
        </ButtonLink>
      ) : null}
    </form>
  );
};
