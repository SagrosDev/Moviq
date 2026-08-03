import { useId } from "react";
import { useLanguage } from "./LanguageProvider";

export const LanguageSelector = () => {
  const id = useId();
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className="language-selector" htmlFor={id}>
      <span>{t("app.language.label")}</span>
      <select
        id={id}
        value={language}
        aria-label={t("app.language.label")}
        onChange={(event) => setLanguage(event.target.value === "en" ? "en" : "es")}
      >
        <option value="es">{t("app.language.spanish")}</option>
        <option value="en">{t("app.language.english")}</option>
      </select>
    </label>
  );
};
