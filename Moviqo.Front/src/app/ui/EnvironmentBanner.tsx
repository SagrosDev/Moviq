import { useLanguage } from "../../shared/localization";

export const EnvironmentBanner = () => {
  const { t } = useLanguage();

  return (
    <section className="environment-banner" aria-labelledby="environment-banner-title">
      <div className="environment-banner__label">UAT</div>
      <div className="environment-banner__content">
        <h2 id="environment-banner-title">{t("environment.banner.title")}</h2>
        <p>{t("environment.banner.body")}</p>
        <ul>
          <li>{t("environment.banner.rule1")}</li>
          <li>{t("environment.banner.rule2")}</li>
          <li>{t("environment.banner.rule3")}</li>
        </ul>
      </div>
    </section>
  );
};
