import { useEffect, useRef, useState } from "react";
import {
  VerificationStatusPanel,
  readVerificationToken,
  verificationLocationWithoutToken,
  verifyEmailToken,
  type VerificationResult,
  type VerificationViewState
} from "../../../features/verification";
import { useLanguage } from "../../../shared/localization";
import { PublicPageShell } from "../../../widgets/public-page-shell";

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
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has("token")) return;
    window.history.replaceState(
      {},
      document.title,
      verificationLocationWithoutToken(
        window.location.pathname,
        window.location.search,
        window.location.hash
      )
    );
  }, []);

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
    <PublicPageShell
      description={t("verification.lede")}
      eyebrow={t("verification.eyebrow")}
      pageName="verification"
      title={t("verification.title")}
      titleId="verification-title"
    >
      <VerificationStatusPanel state={state} />
    </PublicPageShell>
  );
};
