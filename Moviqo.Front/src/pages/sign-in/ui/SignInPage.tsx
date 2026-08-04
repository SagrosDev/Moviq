import { type FormEvent, useState } from "react";
import { signIn } from "../../../features/authentication";
import { LanguageSelector, useLanguage } from "../../../shared/localization";
import { PasswordField } from "../../../shared/ui/PasswordField";

export const SignInPage = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const resetComplete = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("reset") === "complete";
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true); setError(false);
    try { await signIn({ email, password }); window.location.assign("/"); }
    catch { setError(true); setPassword(""); }
    finally { setSubmitting(false); }
  };
  return <div className="app-shell">
    <header className="app-header"><a className="brand" href="/">Moviqo</a><LanguageSelector /></header>
    <main className="app-main"><section className="page-heading" aria-labelledby="sign-in-title">
      <p className="eyebrow">{t("signIn.eyebrow")}</p><h1 id="sign-in-title">{t("signIn.title")}</h1><p className="lede">{t("signIn.lede")}</p>
    </section><form className="form-card" onSubmit={submit} noValidate>
      {resetComplete && <p role="status">{t("passwordRecovery.resetComplete")}</p>}
      {error && <p role="alert">{t("signIn.failure")}</p>}
      <label htmlFor="sign-in-email">{t("signIn.email")}</label><input id="sign-in-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
      <PasswordField id="sign-in-password" label={t("signIn.password")} value={password} onChange={(event) => setPassword(event.target.value)} helperText={t("password.policy.helper")} revealLabel={t("password.policy.reveal")} hideLabel={t("password.policy.hide")} isRevealed={isRevealed} onRevealToggle={() => setIsRevealed((value) => !value)} autoComplete="current-password" />
      <a href="/password-recovery">{t("passwordRecovery.forgotLink")}</a>
      <button className="button" type="submit" disabled={submitting}>{submitting ? t("signIn.submitting") : t("signIn.submit")}</button>
    </form></main>
  </div>;
};
