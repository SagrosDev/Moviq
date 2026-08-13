import { useLanguage } from "../../../shared/localization";
import { Badge } from "../../../shared/ui";
import type { FormDesignerState } from "../model/formDesigner";

export const FormDesignerSaveStatus = ({ state }: { state: FormDesignerState }) => {
  const { t } = useLanguage();
  const label = state.saveStatus === "saving"
    ? t("formDesign.saving")
    : state.saveStatus === "saved"
      ? t("formDesign.saved")
      : state.hasLocalChanges
        ? t("formDesign.unsaved")
        : t("formDesign.saved");
  return (
    <div aria-live="polite">
      <Badge tone={state.saveStatus === "error" || state.saveStatus === "conflict" ? "error" : "neutral"}>
        {label}
      </Badge>
    </div>
  );
};
