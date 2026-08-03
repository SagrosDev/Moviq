import {
  deniedAccessFixture,
  rejectedCompletionFixture
} from "../../../entities/server-decisions";
import { useLanguage } from "../../../shared/localization";
import { Button } from "../../../shared/ui/Button";

export const AuthorityPreview = () => {
  const { t } = useLanguage();

  return (
    <section className="status-panel" aria-labelledby="status-title">
      <h2 id="status-title">{t("authority.title")}</h2>
      <p>{t("authority.accessDenied")}</p>
      <p>{t("authority.completionRejected")}</p>
      <Button type="button">{t("authority.reviewAssignedWork")}</Button>
    </section>
  );
};
