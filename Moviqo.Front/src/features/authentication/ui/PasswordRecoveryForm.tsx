import { type FormEvent, useState } from "react";
import { requestPasswordRecovery } from "../model/passwordRecovery";
import { useLanguage } from "../../../shared/localization";

export const PasswordRecoveryForm = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(false);
    try {
      await requestPasswordRecovery({ email });
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return <p role="status">{t("passwordRecovery.confirmation")}</p>;
  }

  return (
    <form className="form-card" onSubmit={submit} noValidate>
      {error ? <p role="alert">{t("passwordRecovery.failure")}</p> : null}
      <label htmlFor="recovery-email">{t("passwordRecovery.email")}</label>
      <input id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
      <button className="button" type="submit" disabled={submitting}>
        {submitting ? t("passwordRecovery.submitting") : t("passwordRecovery.submit")}
      </button>
    </form>
  );
};
