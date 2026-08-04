import { useEffect, useRef, useState } from "react";
import {
  VerificationStatusPanel,
  readVerificationToken,
  verifyEmailToken,
  type VerificationResult,
  type VerificationViewState
} from "../../../features/verification";
import { LanguageSelector, useLanguage } from "../../../shared/localization";

type VerificationPageProps = {
  search?: string;
  submitVerification?: (token: string) => Promise<VerificationResult>;
};

const defaultSearch = () => {
  return typeof window === "undefined" ? "" : window.location.search;
};

export const VerificationPage = ({
  search = defaultSearch(),
  submitVerification = verifyEmailToken
}: VerificationPageProps) => {
  const { setLanguage, t } = useLanguage();
  const token = readVerificationToken(search);
  const submittedTokenRef = useRef<string | null>(null);
  const [state, setState] = useState<VerificationViewState>(() =>
    token ? { kind: "loading" } : { kind: "invalid" }
  );

  useEffect(() => {
    if (!token) {
      setState({ kind: "invalid" });
      return;
    }

    if (submittedTokenRef.current === token) {
      return;
    }
    submittedTokenRef.current = token;

    let isCurrent = true;

    setState({ kind: "loading" });
    void submitVerification(token)
      .then((result) => {
        if (!isCurrent) {
          return;
        }

        setState({
          kind: "success",
          email: result.email
        });
        if (result.language === "en" || result.language === "es") {
          setLanguage(result.language);
        }
      })
      .catch(() => {
        if (!isCurrent) {
          return;
        }

        setState({ kind: "invalid" });
      });

    return () => {
      isCurrent = false;
    };
  }, [setLanguage, submitVerification, token]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label={t("app.brand.home")}>
          Moviqo
        </a>
        <nav className="app-nav" aria-label={t("app.nav.primary")}>
          <a href="/">{t("app.nav.work")}</a>
          <a href="/#processes">{t("app.nav.processes")}</a>
          <a href="/#admin">{t("app.nav.admin")}</a>
          <a href="/design-system">{t("app.nav.designSystem")}</a>
        </nav>
        <LanguageSelector />
      </header>
      <main className="app-main">
        <section className="page-heading" aria-labelledby="verification-title">
          <p className="eyebrow">{t("verification.eyebrow")}</p>
          <h1 id="verification-title">{t("verification.title")}</h1>
          <p className="lede">{t("verification.lede")}</p>
        </section>
        <VerificationStatusPanel state={state} />
      </main>
    </div>
  );
};
