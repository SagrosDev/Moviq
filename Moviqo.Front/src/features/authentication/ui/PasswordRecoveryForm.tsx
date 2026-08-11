import { type FormEvent, useState } from "react";
import { requestPasswordRecovery } from "../model/passwordRecovery";
import { useLanguage } from "../../../shared/localization";
import { ActionBar, Alert, Button, TextInput } from "../../../shared/ui";

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
    return (
      <Alert announcement="polite" tone="success">
        {t("passwordRecovery.confirmation")}
      </Alert>
    );
  }

  return (
    <form className="grid gap-moviqo-4" onSubmit={submit} noValidate>
      {error ? (
        <Alert announcement="assertive" tone="error">{t("passwordRecovery.failure")}</Alert>
      ) : null}
      <TextInput
        id="recovery-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        label={t("passwordRecovery.email")}
        required
        autoComplete="email"
      />
      <ActionBar>
        <Button type="submit" disabled={submitting} width="full">
          {submitting ? t("passwordRecovery.submitting") : t("passwordRecovery.submit")}
        </Button>
      </ActionBar>
    </form>
  );
};
