import { type FormEvent, useState } from "react";
import { resetPassword } from "../model/passwordRecovery";
import { useLanguage } from "../../../shared/localization";
import { PasswordField } from "../../../shared/ui/PasswordField";

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
      setPassword("");
      setError(t("passwordRecovery.resetFailure"));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section aria-live="polite">
        <p>{t("passwordRecovery.resetComplete")}</p>
        <a className="button" href="/sign-in">{t("passwordRecovery.signIn")}</a>
      </section>
    );
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      {error ? <p role="alert">{error}</p> : null}
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
      />
      <button className="button" type="submit" disabled={submitting || !token}>
        {submitting ? t("passwordRecovery.resetting") : t("passwordRecovery.resetSubmit")}
      </button>
      {(error || !token) ? <a href="/password-recovery">{t("passwordRecovery.requestAgain")}</a> : null}
    </form>
  );
};
