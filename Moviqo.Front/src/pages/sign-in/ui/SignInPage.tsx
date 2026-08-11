import { type FormEvent, useState } from "react";
import {
  resolveProtectedReturnDestination,
  signIn
} from "../../../features/authentication";
import { useLanguage } from "../../../shared/localization";
import {
  ActionBar,
  Alert,
  Button,
  ButtonLink,
  Card,
  PasswordField,
  TextInput
} from "../../../shared/ui";
import { PublicPageShell } from "../../../widgets/public-page-shell";

export const SignInPage = () => {
  const { t } = useLanguage();
  const historyState = typeof window !== "undefined" ? window.history.state : null;
  const navigationState = typeof historyState === "object"
    && historyState !== null
    && "usr" in historyState
    ? historyState.usr
    : undefined;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const resetComplete =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("reset") === "complete";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(false);

    try {
      await signIn({ email, password });
      window.location.assign(resolveProtectedReturnDestination(navigationState));
    } catch {
      setError(true);
      setPassword("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicPageShell
      description={t("signIn.lede")}
      eyebrow={t("signIn.eyebrow")}
      pageName="sign-in"
      title={t("signIn.title")}
      titleId="sign-in-title"
    >
      <Card>
        <form className="grid gap-moviqo-4" onSubmit={submit} noValidate>
          {resetComplete ? (
            <Alert announcement="polite" tone="success">
              {t("passwordRecovery.resetComplete")}
            </Alert>
          ) : null}
          {error ? (
            <Alert announcement="assertive" tone="error">
              {t("signIn.failure")}
            </Alert>
          ) : null}
          <TextInput
            id="sign-in-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            label={t("signIn.email")}
            required
            autoComplete="email"
          />
          <PasswordField
            id="sign-in-password"
            label={t("signIn.password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helperText={t("password.policy.helper")}
            revealLabel={t("password.policy.reveal")}
            hideLabel={t("password.policy.hide")}
            isRevealed={isRevealed}
            onRevealToggle={() => setIsRevealed((value) => !value)}
            autoComplete="current-password"
            required
          />
          <ButtonLink href="/password-recovery" variant="quiet">
            {t("passwordRecovery.forgotLink")}
          </ButtonLink>
          <ActionBar>
            <Button type="submit" disabled={submitting} width="full">
              {submitting ? t("signIn.submitting") : t("signIn.submit")}
            </Button>
          </ActionBar>
        </form>
      </Card>
    </PublicPageShell>
  );
};
