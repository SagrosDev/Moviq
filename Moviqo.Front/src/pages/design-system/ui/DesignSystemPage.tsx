import { useState } from "react";
import { MoviqoMark, MoviqoWordmark } from "../../../shared/branding";
import { catalogComponents } from "../../../shared/design-system";
import { LanguageSelector, useLanguage } from "../../../shared/localization";
import {
  ActionBar,
  Alert,
  AppHeader,
  AppShell,
  Badge,
  Button,
  Card,
  CheckboxField,
  FormGrid,
  FormGridItem,
  FormSection,
  PageContainer,
  PageHeader,
  PasswordField,
  SelectField,
  TextInput
} from "../../../shared/ui";

export const DesignSystemPage = () => {
  const { t } = useLanguage();
  const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);

  return (
    <AppShell>
      <AppHeader
        brandHref="/"
        brandLabel={<MoviqoWordmark />}
        brandHomeLabel={t("app.brand.home")}
        brandMark={<MoviqoMark />}
        actions={<LanguageSelector />}
        size="wide"
      />
      <main>
        <PageContainer size="wide">
          <div className="grid gap-moviqo-6">
            <PageHeader
              titleId="design-system-title"
              eyebrow={t("catalog.responsive.title")}
              title={t("catalog.title")}
              description={t("catalog.subtitle")}
            />

            <section className="grid gap-moviqo-3" aria-labelledby="landing-navigation-preview-title">
              <h2 className="m-0 text-moviqo-heading font-semibold" id="landing-navigation-preview-title">
                {t("app.nav.primary")}
              </h2>
              <nav
                className="flex flex-wrap items-center gap-moviqo-2 rounded-moviqo-control border border-moviqo-border bg-moviqo-surface-raised p-moviqo-3"
                aria-label={t("app.nav.primary")}
                data-catalog-composition="landing-navigation"
              >
                <a
                  className="inline-flex min-h-11 items-center rounded-moviqo-control px-moviqo-3 font-semibold text-moviqo-primary no-underline hover:bg-moviqo-surface-soft focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moviqo-focus"
                  href="/register"
                >
                  {t("home.cta.register")}
                </a>
                <a
                  className="inline-flex min-h-11 items-center rounded-moviqo-control px-moviqo-3 font-semibold text-moviqo-primary no-underline hover:bg-moviqo-surface-soft focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-moviqo-focus"
                  href="/sign-in"
                >
                  {t("auth.signIn")}
                </a>
              </nav>
            </section>

            <div data-catalog-composition="cards">
              <Card labelledBy="responsive-contract-title" tone="soft">
                <h2 className="m-0 text-moviqo-heading font-semibold" id="responsive-contract-title">
                  {t("catalog.responsive.title")}
                </h2>
                <p className="m-0 text-moviqo-ink-secondary">{t("catalog.responsive.operational")}</p>
                <p className="m-0 text-moviqo-ink-secondary">{t("catalog.responsive.designer")}</p>
              </Card>
            </div>

            <section className="grid gap-moviqo-3" aria-labelledby="environment-preview-title">
              <h2 className="m-0 text-moviqo-heading font-semibold" id="environment-preview-title">
                {t("environment.banner.title")}
              </h2>
              <div className="flex flex-wrap items-center gap-moviqo-3 rounded-moviqo-control border border-moviqo-warning bg-moviqo-surface-raised px-moviqo-4 py-moviqo-2 text-sm text-moviqo-ink-primary" data-catalog-composition="uat-indicator">
                <Badge tone="warning">BETA</Badge>
                <span>{t("environment.banner.body")}</span>
              </div>
            </section>

            <section className="grid gap-moviqo-4" aria-labelledby="button-preview-title" data-catalog-composition="buttons">
              <div className="grid gap-moviqo-1">
                <h2 className="m-0 text-moviqo-heading font-semibold" id="button-preview-title">
                  {t("catalog.button.title")}
                </h2>
                <p className="m-0 text-moviqo-ink-secondary">{t("catalog.button.responsive")}</p>
              </div>
              <ActionBar align="start">
                <Button id="design-system-primary" type="button" data-catalog-state="normal focus">{t("catalog.button.primary")}</Button>
                <Button type="button" variant="secondary" data-catalog-state="hover">{t("catalog.step.back")}</Button>
                <Button type="button" variant="quiet">{t("catalog.step.continue")}</Button>
                <Button type="button" disabled data-catalog-state="disabled">{t("catalog.button.loading")}</Button>
              </ActionBar>
            </section>

            <section className="grid gap-moviqo-5" id="forms" aria-labelledby="forms-preview-title">
              <div className="grid gap-moviqo-1">
                <h2 className="m-0 text-moviqo-heading font-semibold" id="forms-preview-title">
                  {t("registration.form.title")}
                </h2>
                <p className="m-0 text-moviqo-ink-secondary">{t("catalog.field.responsive")}</p>
              </div>
              <div className="grid gap-moviqo-5 desktop:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                <Card labelledBy="authentication-preview-title">
                  <form
                    data-catalog-composition="authentication-form"
                    noValidate
                    onSubmit={(event) => event.preventDefault()}
                  >
                    <FormSection
                      titleId="authentication-preview-title"
                      title={t("signIn.title")}
                      description={t("signIn.lede")}
                    >
                      <div className="grid gap-moviqo-4">
                        <TextInput
                          id="catalog-sign-in-email"
                          label={t("signIn.email")}
                          placeholder={t("catalog.field.placeholder")}
                          type="email"
                        />
                        <PasswordField
                          id="catalog-sign-in-password"
                          label={t("signIn.password")}
                          helperText={t("password.policy.helper")}
                          revealLabel={t("password.policy.reveal")}
                          hideLabel={t("password.policy.hide")}
                          isRevealed={isPasswordRevealed}
                          onRevealToggle={() => setIsPasswordRevealed((value) => !value)}
                        />
                        <Button type="submit" width="full">{t("signIn.submit")}</Button>
                      </div>
                    </FormSection>
                  </form>
                </Card>

                <Card labelledBy="registration-preview-title">
                  <form
                    data-catalog-composition="registration-form"
                    noValidate
                    onSubmit={(event) => event.preventDefault()}
                  >
                    <FormSection
                      titleId="registration-preview-title"
                      title={t("registration.title")}
                      description={t("registration.lede")}
                    >
                      <FormGrid>
                        <FormGridItem span="half">
                          <TextInput
                            id="catalog-owner-name"
                            label={t("registration.ownerName.label")}
                            placeholder={t("catalog.field.placeholder")}
                          />
                        </FormGridItem>
                        <FormGridItem span="half">
                          <TextInput
                            id="catalog-organization-name"
                            label={t("registration.organizationName.label")}
                            errorMessage={t("validation.required")}
                            aria-invalid="true"
                          />
                        </FormGridItem>
                        <FormGridItem span="half">
                          <SelectField
                            id="catalog-language"
                            label={t("registration.language.label")}
                            options={[
                              { value: "es", label: t("app.language.spanish") },
                              { value: "en", label: t("app.language.english") }
                            ]}
                          />
                        </FormGridItem>
                        <FormGridItem span="half">
                          <TextInput
                            id="catalog-region"
                            label={t("registration.region.label")}
                            value="CO"
                            readOnly
                          />
                        </FormGridItem>
                        <FormGridItem span="full">
                          <CheckboxField
                            id="catalog-consent"
                            label={t("registration.terms.label")}
                            checked
                            readOnly
                          />
                        </FormGridItem>
                      </FormGrid>
                      <ActionBar>
                        <Button type="submit">{t("registration.submit")}</Button>
                      </ActionBar>
                    </FormSection>
                  </form>
                </Card>
              </div>
            </section>

            <section className="grid gap-moviqo-5" id="feedback" aria-labelledby="feedback-preview-title">
              <h2 className="m-0 text-moviqo-heading font-semibold" id="feedback-preview-title">
                {t("catalog.publish.title")}
              </h2>
              <div className="grid gap-moviqo-4 tablet:grid-cols-3" data-catalog-composition="alerts">
                <div data-catalog-state="success">
                  <Alert tone="success" title={t("status.ready")}>
                    <p className="m-0 text-moviqo-ink-primary">{t("verification.success.body")}</p>
                  </Alert>
                </div>
                <div data-catalog-state="warning">
                  <Alert tone="warning" title={t("status.needsAttention")}>
                    <p className="m-0 text-moviqo-ink-primary">{t("catalog.publish.issue")}</p>
                  </Alert>
                </div>
                <div data-catalog-state="error">
                  <Alert tone="error" title={t("status.blocked")}>
                    <p className="m-0 text-moviqo-ink-primary">{t("registration.failure")}</p>
                  </Alert>
                </div>
              </div>
              <div className="flex flex-wrap gap-moviqo-2" aria-label={t("catalog.metadata.title")} data-catalog-composition="badges">
                <Badge>{t("status.assigned")}</Badge>
                <Badge tone="info">{t("status.inProgress")}</Badge>
                <Badge tone="success">{t("status.ready")}</Badge>
                <Badge tone="warning">{t("status.needsAttention")}</Badge>
                <Badge tone="error">{t("status.blocked")}</Badge>
              </div>
            </section>

            <section className="grid gap-moviqo-4" id="timeline" aria-labelledby="timeline-preview-title">
              <h2 className="m-0 text-moviqo-heading font-semibold" id="timeline-preview-title">
                {t("catalog.timeline.title")}
              </h2>
              <Card labelledBy="timeline-preview-title">
                <ol className="m-0 grid list-none gap-moviqo-3 p-0">
                  <li className="grid grid-cols-[auto_minmax(0,1fr)] gap-moviqo-3 border-b border-moviqo-border pb-moviqo-3 last:border-0 last:pb-0" data-catalog-composition="timeline-row">
                    <time className="font-semibold text-moviqo-primary" dateTime="2026-08-10T09:00:00-05:00">09:00</time>
                    <div className="grid gap-moviqo-1">
                      <strong>{t("catalog.timeline.event")}</strong>
                      <span className="text-moviqo-ink-secondary">{t("catalog.timeline.position")}</span>
                    </div>
                  </li>
                </ol>
              </Card>
            </section>

            <section className="grid gap-moviqo-3" aria-labelledby="catalog-metadata-title">
              <h2 className="m-0 text-moviqo-heading font-semibold" id="catalog-metadata-title">
                {t("catalog.metadata.title")}
              </h2>
              <ul className="m-0 grid gap-moviqo-2 pl-moviqo-5 text-moviqo-ink-secondary">
                {catalogComponents.map((component) => (
                  <li key={component.kind}>
                    <strong className="text-moviqo-ink-primary">{t(component.titleKey)}:</strong>{" "}
                    {t(component.responsiveBehaviorKey)} {t(component.permittedContentKey)}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </PageContainer>
      </main>
    </AppShell>
  );
};
