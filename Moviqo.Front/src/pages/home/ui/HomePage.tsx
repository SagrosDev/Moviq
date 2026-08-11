import { useEffect } from "react";
import { MoviqoMark, MoviqoWordmark } from "../../../shared/branding";
import { LanguageSelector, useLanguage } from "../../../shared/localization";
import {
  ActionBar,
  AppHeader,
  AppShell,
  Badge,
  ButtonLink,
  Card,
  PageContainer
} from "../../../shared/ui";
import { landingContent, landingDestinations, resolveLandingMetadata } from "../model/landingContent";

export type DestinationKind = "application" | "document" | "support";

export type DestinationOptions = {
  expectedPath?: string;
  kind?: DestinationKind;
  origin?: string;
  allowedOrigins?: string[];
};

type FictionalCaseBadgeProps = {
  label: string;
};

type WorkflowIllustrationProps = {
  label: string;
};

type ScenarioDetailRowsProps = {
  details: readonly string[];
};

const FictionalCaseBadge = ({ label }: FictionalCaseBadgeProps) => {
  return (
    <span data-fictional-case-badge="true">
      <Badge tone="info">{label}</Badge>
    </span>
  );
};

const WorkflowIllustration = ({ label }: WorkflowIllustrationProps) => {
  return (
    <div
      className="overflow-hidden rounded-moviqo-control border border-moviqo-border bg-moviqo-surface-soft px-moviqo-3 py-moviqo-2"
      data-workflow-illustration="connected-steps"
    >
      <svg className="h-auto w-full" viewBox="0 0 520 132" role="img" aria-label={label}>
        <path
          className="stroke-moviqo-primary"
          d="M112 66h82m132 0h82"
          fill="none"
          strokeDasharray="8 7"
          strokeLinecap="round"
          strokeWidth="4"
        />
        <g className="fill-moviqo-surface-raised stroke-moviqo-border" strokeWidth="2">
          <rect x="18" y="20" width="94" height="92" rx="16" />
          <rect x="194" y="20" width="132" height="92" rx="16" />
          <rect x="408" y="20" width="94" height="92" rx="16" />
        </g>
        <g className="fill-none stroke-moviqo-primary" strokeLinecap="round" strokeLinejoin="round" strokeWidth="5">
          <path d="M48 45h34M48 61h34M48 77h22" />
          <circle cx="242" cy="54" r="12" />
          <path d="M219 88c5-13 13-20 23-20s18 7 23 20M278 56h24M278 73h24M278 90h17" />
          <path d="m438 67 16 16 27-34" />
        </g>
        <g className="fill-moviqo-primary">
          <circle cx="112" cy="66" r="6" />
          <circle cx="194" cy="66" r="6" />
          <circle cx="326" cy="66" r="6" />
          <circle cx="408" cy="66" r="6" />
        </g>
      </svg>
    </div>
  );
};

const ScenarioDetailRows = ({ details }: ScenarioDetailRowsProps) => {
  return (
    <ol className="m-0 grid list-none gap-moviqo-2 p-0" data-scenario-detail-list="numbered" role="list">
      {details.map((detail, index) => (
        <li
          className="flex items-center gap-moviqo-2 rounded-moviqo-control border border-moviqo-border bg-moviqo-surface-soft px-moviqo-3 py-moviqo-2 text-sm text-moviqo-ink-secondary"
          data-scenario-detail-row="true"
          key={detail}
        >
          <span
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-moviqo-pill bg-moviqo-primary text-sm font-semibold text-moviqo-primary-foreground"
          >
            {index + 1}
          </span>
          <span>{detail}</span>
        </li>
      ))}
    </ol>
  );
};

export const configuredDestination = (
  value: string | undefined,
  fallback: string,
  options: DestinationOptions = {}
) => {
  const { expectedPath, kind = expectedPath ? "application" : "document", origin = "https://moviqo.invalid", allowedOrigins = [origin] } = options;
  if (!value) return fallback;
  if (/\r|\n/.test(value)) return fallback;
  try {
    const url = new URL(value, origin);
    if (url.username || url.password) return fallback;
    if (expectedPath) {
      if (!["http:", "https:"].includes(url.protocol) || !allowedOrigins.includes(url.origin) || url.pathname !== expectedPath) return fallback;
      return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : url.toString();
    }
    if (kind === "support") {
      return /^mailto:[^@\s]+@[^@\s]+$/i.test(value) ? value : fallback;
    }
    return ["http:", "https:"].includes(url.protocol) && allowedOrigins.includes(url.origin)
      ? value
      : fallback;
  } catch {
    return fallback;
  }
};

const configuredMetaDestination = (name: string, fallback: string, options?: DestinationOptions) => {
  if (typeof document === "undefined") return fallback;
  const origin = window.location.origin;
  const allowedOrigins = (document.querySelector('meta[name="moviqo-allowed-public-origins"]')?.getAttribute("content") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => { try { const url = new URL(item); return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.origin : ""; } catch { return ""; } })
    .filter(Boolean);
  return configuredDestination(
    document.querySelector(`meta[name="${name}"]`)?.getAttribute("content") ?? undefined,
    fallback,
    { ...options, origin, allowedOrigins: allowedOrigins.length > 0 ? allowedOrigins : [origin] }
  );
};

const setMetaContent = (selector: string, content: string) => {
  document.querySelector(selector)?.setAttribute("content", content);
};

export const HomePage = () => {
  const { language, t } = useLanguage();
  const content = landingContent[language];
  const register = configuredMetaDestination("moviqo-register-url", landingDestinations.register, { expectedPath: "/register" });
  const signIn = configuredMetaDestination("moviqo-sign-in-url", landingDestinations.signIn, { expectedPath: "/sign-in" });
  const betaTerms = configuredMetaDestination("moviqo-beta-terms-url", landingDestinations.betaTerms, { kind: "document" });
  const privacy = configuredMetaDestination("moviqo-privacy-url", landingDestinations.privacy, { kind: "document" });
  const prohibitedData = configuredMetaDestination("moviqo-prohibited-data-url", landingDestinations.prohibitedData, { kind: "document" });
  const support = configuredMetaDestination("moviqo-support-url", landingDestinations.support, { kind: "support" });
  const withSelectedLanguage = (destination: string, selectedLanguage: typeof language) => {
    if (typeof window === "undefined") return destination;
    const url = new URL(destination, window.location.origin);
    if (url.origin === window.location.origin) {
      if (selectedLanguage === "en") {
        url.searchParams.set("lang", selectedLanguage);
        return `${url.pathname}${url.search}${url.hash}`;
      }
      url.searchParams.delete("lang");
      return `${url.pathname}${url.search}${url.hash}`;
    }
    url.searchParams.set("lang", selectedLanguage);
    return url.toString();
  };
  const registerDestination = withSelectedLanguage(register, language);
  const signInDestination = withSelectedLanguage(signIn, language);

  useEffect(() => {
    const metadata = resolveLandingMetadata(language, window.location.origin);
    document.documentElement.lang = language;
    document.title = metadata.title;
    setMetaContent('meta[name="description"]', metadata.description);
    setMetaContent('meta[property="og:title"]', metadata.title);
    setMetaContent('meta[property="og:description"]', metadata.description);
    setMetaContent('meta[property="og:url"]', metadata.canonical);
    setMetaContent('meta[property="og:locale"]', metadata.locale);
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", metadata.canonical);
    const alternateLink = document.querySelector('link[rel="alternate"][data-moviqo-locale]');
    alternateLink?.setAttribute("href", metadata.alternate.href);
    alternateLink?.setAttribute("hreflang", metadata.alternate.hrefLang);
  }, [language]);

  return (
    <AppShell>
      <AppHeader
        brandHref="/"
        brandLabel={<MoviqoWordmark />}
        brandHomeLabel={t("app.brand.home")}
        brandMark={<MoviqoMark />}
        navigationLabel={language === "es" ? "Navegación de la página" : "Page navigation"}
        navigation={[
          { href: "#how-it-works", label: content.nav.story },
          { href: "#examples", label: content.nav.examples },
          { href: "#trust", label: content.nav.trust }
        ]}
        size="wide"
        actions={(
          <>
            <LanguageSelector />
            <ButtonLink href={signInDestination} variant="secondary">{content.hero.secondary}</ButtonLink>
          </>
        )}
      />

      <main>
        <PageContainer size="wide">
          <div className="grid gap-moviqo-6">
            <section className="grid min-w-0 items-center gap-moviqo-6 py-moviqo-6 desktop:grid-cols-2" aria-labelledby="landing-title">
              <div className="grid min-w-0 max-w-3xl gap-moviqo-5">
                <span className="justify-self-start"><Badge tone="info">{content.hero.eyebrow}</Badge></span>
                <h1 className="m-0 text-moviqo-display font-semibold text-moviqo-ink-primary" id="landing-title">
                  {content.hero.title}
                </h1>
                <p className="m-0 text-lg leading-relaxed text-moviqo-ink-secondary">{content.hero.body}</p>
                <p className="m-0 text-moviqo-body leading-relaxed text-moviqo-ink-primary">{content.hero.capabilities}</p>
                <ActionBar align="start">
                  <ButtonLink href={registerDestination}>{content.hero.primary}</ButtonLink>
                  <ButtonLink href={signInDestination} variant="secondary">{content.hero.secondary}</ButtonLink>
                </ActionBar>
                <p className="m-0 text-lg font-semibold leading-relaxed text-moviqo-ink-secondary">{content.timeToValue}</p>
              </div>

              <div className="min-w-0" data-product-visual="fictional-workflow">
                <Card labelledBy="landing-product-preview-title" tone="accent">
                  <div className="flex flex-wrap items-center justify-between gap-moviqo-2">
                    <FictionalCaseBadge label={content.scenarios[0].label} />
                    <Badge>{content.scenarios[0].details[2]}</Badge>
                  </div>
                  <div className="grid gap-moviqo-2">
                    <h2 className="m-0 text-moviqo-heading font-semibold" id="landing-product-preview-title">
                      {content.scenarios[0].name}
                    </h2>
                    <p className="m-0 text-moviqo-ink-secondary">{content.scenarios[0].description}</p>
                  </div>
                  <WorkflowIllustration label={content.visuals.alt} />
                  <ScenarioDetailRows details={content.scenarios[0].details.slice(0, 2)} />
                </Card>
              </div>
            </section>

            <section className="grid gap-moviqo-4 border-t border-moviqo-border py-moviqo-6 desktop:grid-cols-2" aria-labelledby="problem-title">
              <div className="grid gap-moviqo-2">
                <p className="m-0 text-moviqo-body font-semibold text-moviqo-primary" data-section-label="true">{content.problem.eyebrow}</p>
                <h2 className="m-0 text-moviqo-heading font-semibold" id="problem-title">{content.problem.title}</h2>
              </div>
              <p className="m-0 text-lg leading-relaxed text-moviqo-ink-secondary">{content.problem.body}</p>
            </section>

            <section className="grid scroll-mt-24 gap-moviqo-4 border-t border-moviqo-border py-moviqo-6" id="how-it-works" aria-labelledby="how-title">
              <div className="grid gap-moviqo-2">
                <p className="m-0 text-moviqo-body font-semibold text-moviqo-primary" data-section-label="true">{content.howItWorks.eyebrow}</p>
                <h2 className="m-0 text-moviqo-heading font-semibold" id="how-title">{content.howItWorks.title}</h2>
              </div>
              <div className="grid gap-moviqo-4 tablet:grid-cols-3">
                {content.howItWorks.steps.map((step, index) => (
                  <Card key={step.title} labelledBy={`landing-step-${index}`}>
                    <h3 className="m-0 text-lg font-semibold" id={`landing-step-${index}`}>{step.title}</h3>
                    <p className="m-0 text-moviqo-ink-secondary">{step.body}</p>
                  </Card>
                ))}
              </div>
            </section>

            <section className="grid scroll-mt-24 gap-moviqo-4 border-t border-moviqo-border py-moviqo-6" id="examples" aria-labelledby="examples-title">
              <div className="grid gap-moviqo-2">
                <p className="m-0 text-moviqo-body font-semibold text-moviqo-primary" data-section-label="true">{content.examples.eyebrow}</p>
                <h2 className="m-0 text-moviqo-heading font-semibold" id="examples-title">{content.examples.title}</h2>
              </div>
              <div className="grid gap-moviqo-4 tablet:grid-cols-3">
                {content.scenarios.map((scenario, index) => (
                  <Card key={scenario.name} labelledBy={`landing-scenario-${index}`} tone="default">
                    <FictionalCaseBadge label={scenario.label} />
                    <h3 className="m-0 text-lg font-semibold" id={`landing-scenario-${index}`}>{scenario.name}</h3>
                    <p className="m-0 text-moviqo-ink-secondary">{scenario.description}</p>
                    <ScenarioDetailRows details={scenario.details} />
                    <span className="sr-only">{scenario.alt}</span>
                  </Card>
                ))}
              </div>
            </section>

            <section className="grid scroll-mt-24 gap-moviqo-5 border-t border-moviqo-border py-moviqo-6 desktop:grid-cols-2" id="trust" aria-labelledby="trust-title">
              <div className="grid content-start gap-moviqo-3">
                <p className="m-0 text-moviqo-body font-semibold text-moviqo-primary" data-section-label="true">{content.trust.eyebrow}</p>
                <h2 className="m-0 text-moviqo-heading font-semibold" id="trust-title">{content.trust.title}</h2>
                <p className="m-0 text-moviqo-ink-secondary">{content.trust.body}</p>
              </div>
              <Card tone="soft">
                <ul className="m-0 grid gap-moviqo-3 pl-moviqo-5">
                  {content.trust.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </Card>
            </section>

            <section className="grid gap-moviqo-5 border-t border-moviqo-border py-moviqo-6 desktop:grid-cols-2" aria-labelledby="beta-title">
              <div className="grid gap-moviqo-3">
                <p className="m-0 text-moviqo-body font-semibold text-moviqo-primary" data-section-label="true">{content.beta.eyebrow}</p>
                <h2 className="m-0 text-moviqo-heading font-semibold" id="beta-title">{content.beta.title}</h2>
                <p className="m-0 text-moviqo-ink-secondary">{content.beta.body}</p>
              </div>
              <Card>
                <nav className="grid gap-moviqo-3" aria-label={content.beta.title}>
                  <a className="text-moviqo-primary underline underline-offset-4" href={betaTerms}>{content.beta.links[0]}</a>
                  <a className="text-moviqo-primary underline underline-offset-4" href={privacy}>{content.beta.links[1]}</a>
                  <a className="text-moviqo-primary underline underline-offset-4" href={prohibitedData}>{content.beta.links[2]}</a>
                  <a className="text-moviqo-primary underline underline-offset-4" href={support}>{content.beta.support}</a>
                </nav>
              </Card>
            </section>

            <div className="py-moviqo-6">
              <Card labelledBy="final-title" tone="accent">
                <div className="grid gap-moviqo-3">
                  <h2 className="m-0 text-moviqo-heading font-semibold" id="final-title">{content.final.title}</h2>
                  <p className="m-0 text-moviqo-ink-secondary">{content.final.body}</p>
                </div>
                <ActionBar align="start">
                  <ButtonLink href={registerDestination}>{content.final.primary}</ButtonLink>
                  <ButtonLink href={signInDestination} variant="secondary">{content.final.secondary}</ButtonLink>
                </ActionBar>
              </Card>
            </div>
          </div>
        </PageContainer>
      </main>

      <footer className="border-t border-moviqo-border bg-moviqo-surface-raised">
        <PageContainer size="wide">
          <div className="flex flex-wrap items-center justify-between gap-moviqo-4">
            <div className="grid gap-moviqo-2">
              <div className="flex items-center gap-moviqo-2"><MoviqoMark /><MoviqoWordmark /></div>
              <small className="text-moviqo-ink-secondary" data-footer-rights="true">{content.footer.rights}</small>
            </div>
            <nav className="flex flex-wrap gap-moviqo-4 text-sm" aria-label={language === "es" ? "Enlaces públicos" : "Public links"}>
              <a className="text-moviqo-primary underline-offset-4 hover:underline" href={betaTerms}>{content.beta.links[0]}</a>
              <a className="text-moviqo-primary underline-offset-4 hover:underline" href={privacy}>{content.beta.links[1]}</a>
              <a className="text-moviqo-primary underline-offset-4 hover:underline" href={support}>{content.beta.support}</a>
            </nav>
          </div>
        </PageContainer>
      </footer>
    </AppShell>
  );
};
