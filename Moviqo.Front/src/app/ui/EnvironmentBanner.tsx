import { useLanguage } from "../../shared/localization";
import { Badge } from "../../shared/ui";

export const EnvironmentBanner = () => {
  const { t } = useLanguage();

  return (
    <aside
      className="flex flex-wrap items-center justify-center gap-moviqo-2 border-b-2 border-moviqo-warning bg-moviqo-surface-soft px-moviqo-gutter-mobile py-moviqo-3 text-center text-moviqo-body text-moviqo-ink-primary tablet:px-moviqo-gutter-desktop"
      aria-label={t("environment.banner.title")}
      data-environment="synthetic-only"
    >
      <Badge tone="warning">BETA</Badge>
      <strong>{t("environment.banner.title")}</strong>
      <span>{t("environment.banner.body")}</span>
    </aside>
  );
};
