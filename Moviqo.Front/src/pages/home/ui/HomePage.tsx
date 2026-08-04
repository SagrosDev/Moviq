import { useEffect } from "react";
import { LanguageSelector, useLanguage } from "../../../shared/localization";
import { landingContent, landingDestinations } from "../model/landingContent";

export type DestinationKind = "application" | "document" | "support";

export type DestinationOptions = {
  expectedPath?: string;
  kind?: DestinationKind;
  origin?: string;
  allowedOrigins?: string[];
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

export const HomePage = () => {
  const { language } = useLanguage();
  const content = landingContent[language];
  const register = configuredMetaDestination("moviqo-register-url", landingDestinations.register, { expectedPath: "/register" });
  const signIn = configuredMetaDestination("moviqo-sign-in-url", landingDestinations.signIn, { expectedPath: "/sign-in" });
  const betaTerms = configuredMetaDestination("moviqo-beta-terms-url", landingDestinations.betaTerms, { kind: "document" });
  const privacy = configuredMetaDestination("moviqo-privacy-url", landingDestinations.privacy, { kind: "document" });
  const prohibitedData = configuredMetaDestination("moviqo-prohibited-data-url", landingDestinations.prohibitedData, { kind: "document" });
  const support = configuredMetaDestination("moviqo-support-url", landingDestinations.support, { kind: "support" });
  const withCrossOriginLanguage = (destination: string, selectedLanguage: typeof language) => {
    if (typeof window === "undefined") return destination;
    const url = new URL(destination, window.location.origin);
    if (url.origin === window.location.origin) return destination;
    url.searchParams.set("lang", selectedLanguage);
    return url.toString();
  };
  const registerDestination = withCrossOriginLanguage(register, language);
  const signInDestination = withCrossOriginLanguage(signIn, language);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === "es" ? "Moviqo · Procesos claros" : "Moviqo · Clear processes";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      language === "es"
        ? "Moviqo ayuda a equipos a convertir procesos repetibles en trabajo claro."
        : "Moviqo helps teams turn repeatable processes into clear work."
    );
  }, [language]);

  return (
    <div className="landing-shell">
      <header className="landing-header">
        <a className="brand" href="/" aria-label="Moviqo">Moviqo</a>
        <nav className="landing-nav" aria-label={language === "es" ? "Navegación de la página" : "Page navigation"}>
          <a href="#how-it-works">{content.nav.story}</a>
          <a href="#examples">{content.nav.examples}</a>
          <a href="#trust">{content.nav.trust}</a>
        </nav>
        <div className="landing-header__actions">
          <LanguageSelector />
          <a className="landing-sign-in" href={signInDestination}>{content.hero.secondary}</a>
        </div>
      </header>

      <main>
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy">
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1 id="landing-title">{content.hero.title}</h1>
            <p className="lede">{content.hero.body}</p>
            <p className="landing-capabilities">{content.hero.capabilities}</p>
            <div className="button-row">
              <a className="button" href={registerDestination}>{content.hero.primary}</a>
              <a className="button" data-variant="secondary" href={signInDestination}>{content.hero.secondary}</a>
            </div>
            <p className="landing-time-to-value">{content.timeToValue}</p>
          </div>
          <div className="landing-hero__visual" aria-label={content.visuals.alt} role="img">
            <div className="mock-window">
              <span className="mock-window__label">{content.visuals.form}</span>
              <strong>{content.scenarios[0].name}</strong>
              <span className="mock-field" />
              <span className="mock-field mock-field--short" />
              <span className="mock-window__status">{content.visuals.task}</span>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--split" aria-labelledby="problem-title">
          <div><p className="eyebrow">{content.problem.eyebrow}</p><h2 id="problem-title">{content.problem.title}</h2></div>
          <p>{content.problem.body}</p>
        </section>

        <section className="landing-section" id="how-it-works" aria-labelledby="how-title">
          <p className="eyebrow">{content.howItWorks.eyebrow}</p>
          <h2 id="how-title">{content.howItWorks.title}</h2>
          <div className="landing-grid landing-grid--three">
            {content.howItWorks.steps.map((step) => <article className="landing-card" key={step.title}><h3>{step.title}</h3><p>{step.body}</p></article>)}
          </div>
        </section>

        <section className="landing-section" id="examples" aria-labelledby="examples-title">
          <p className="eyebrow">{content.examples.eyebrow}</p>
          <h2 id="examples-title">{content.examples.title}</h2>
          <div className="landing-grid landing-grid--three">
            {content.scenarios.map((scenario) => <article className="landing-card scenario-card" key={scenario.name}>
              <p className="scenario-card__label">{scenario.label}</p><h3>{scenario.name}</h3><p>{scenario.description}</p>
              <ul>{scenario.details.map((detail) => <li key={detail}>{detail}</li>)}</ul>
              <span className="sr-only">{scenario.alt}</span>
            </article>)}
          </div>
        </section>

        <section className="landing-section landing-visuals" aria-labelledby="visuals-title">
          <div><p className="eyebrow">{content.visuals.eyebrow}</p><h2 id="visuals-title">{content.visuals.title}</h2></div>
          <div className="visual-stack" role="img" aria-label={content.visuals.alt}>
            <div className="visual-row"><span>{content.visuals.form}</span><b>{content.scenarios[1].name}</b></div>
            <div className="visual-row"><span>{content.visuals.task}</span><b>{content.scenarios[2].details[1]}</b></div>
            <div className="visual-row"><span>{content.visuals.timeline}</span><b>{content.scenarios[0].details[2]}</b></div>
          </div>
        </section>

        <section className="landing-section landing-trust" id="trust" aria-labelledby="trust-title">
          <p className="eyebrow">{content.trust.eyebrow}</p><h2 id="trust-title">{content.trust.title}</h2><p>{content.trust.body}</p>
          <ul className="landing-checklist">{content.trust.items.map((item) => <li key={item}>{item}</li>)}</ul>
        </section>

        <section className="landing-section landing-beta" aria-labelledby="beta-title">
          <div><p className="eyebrow">{content.beta.eyebrow}</p><h2 id="beta-title">{content.beta.title}</h2><p>{content.beta.body}</p></div>
          <div className="landing-beta__links">
            {betaTerms && <a href={betaTerms}>{content.beta.links[0]}</a>}
            {privacy && <a href={privacy}>{content.beta.links[1]}</a>}
            {prohibitedData && <a href={prohibitedData}>{content.beta.links[2]}</a>}
            {support && <a href={support}>{content.beta.support}</a>}
          </div>
        </section>

        <section className="landing-final" aria-labelledby="final-title">
          <h2 id="final-title">{content.final.title}</h2><p>{content.final.body}</p>
          <div className="button-row"><a className="button" href={registerDestination}>{content.final.primary}</a><a className="button" data-variant="secondary" href={signInDestination}>{content.final.secondary}</a></div>
        </section>
      </main>
      <footer className="landing-footer"><span>Moviqo</span><span>{content.hero.eyebrow}</span></footer>
    </div>
  );
};
