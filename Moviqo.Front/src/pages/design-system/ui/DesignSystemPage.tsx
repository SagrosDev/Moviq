import { catalogComponents } from "../../../shared/design-system";
import { LanguageSelector, useLanguage } from "../../../shared/localization";
import {
  AssignmentControl,
  FormFieldDemo,
  GuidanceCard,
  GuidedStep,
  PublishChecklist,
  TaskCard,
  TimelineDemo,
  WorkflowElement
} from "../../../shared/ui/catalog";
import { Button } from "../../../shared/ui/Button";

export const DesignSystemPage = () => {
  const { t } = useLanguage();

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
        </nav>
        <LanguageSelector />
      </header>
      <main className="app-main design-system-page">
        <section className="page-heading" aria-labelledby="design-system-title">
          <p className="eyebrow">{t("catalog.responsive.title")}</p>
          <h1 id="design-system-title">{t("catalog.title")}</h1>
          <p className="lede">{t("catalog.subtitle")}</p>
        </section>

        <section className="token-band" aria-labelledby="responsive-title">
          <h2 id="responsive-title">{t("catalog.responsive.title")}</h2>
          <p>{t("catalog.responsive.operational")}</p>
          <p>{t("catalog.responsive.designer")}</p>
        </section>

        <section className="catalog-grid" aria-label={t("catalog.title")}>
          <section className="catalog-card" aria-labelledby="button-title">
            <h2 id="button-title">{t("catalog.button.title")}</h2>
            <div className="button-row">
              <Button type="button">{t("catalog.button.primary")}</Button>
              <Button type="button" aria-busy="true" disabled>
                {t("catalog.button.loading")}
              </Button>
            </div>
          </section>
          <GuidanceCard t={t} />
          <FormFieldDemo t={t} />
          <GuidedStep t={t} />
          <WorkflowElement t={t} />
          <TaskCard t={t} />
          <AssignmentControl t={t} />
          <PublishChecklist t={t} />
          <TimelineDemo t={t} />
        </section>

        <section className="catalog-metadata" aria-labelledby="catalog-metadata-title">
          <h2 id="catalog-metadata-title">{t("catalog.metadata.title")}</h2>
          <ul>
            {catalogComponents.map((component) => (
              <li key={component.kind}>
                <strong>{t(component.titleKey)}:</strong> {t(component.responsiveBehaviorKey)}{" "}
                {t(component.permittedContentKey)}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};
