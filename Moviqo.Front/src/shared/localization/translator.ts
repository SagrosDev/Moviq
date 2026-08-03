import {
  defaultLanguage,
  englishMessages,
  spanishMessages,
  supportedLanguages,
  type Language,
  type MessageKey
} from "./messages";

export type MoviqoTranslator = (key: MessageKey) => string;

export type DesignerAuthoredText = {
  readonly source: "designer-authored";
  readonly value: string;
};

export const designerAuthoredText = (value: string): DesignerAuthoredText => {
  return { source: "designer-authored", value };
};

export const renderDesignerAuthoredText = (text: DesignerAuthoredText): string => {
  return text.value;
};

export const isSupportedLanguage = (value: string | null | undefined): value is Language => {
  return supportedLanguages.includes(value as Language);
};

export const resolveInitialLanguage = (
  savedPreference: string | null | undefined,
  browserLanguages: readonly string[] = []
): Language => {
  if (isSupportedLanguage(savedPreference)) {
    return savedPreference;
  }

  const browserMatch = browserLanguages
    .map((language) => language.toLowerCase().split("-")[0])
    .find(isSupportedLanguage);

  return browserMatch ?? defaultLanguage;
};

export const translate = (language: Language, key: MessageKey): string => {
  if (language === "en") {
    return englishMessages[key] ?? spanishMessages[key];
  }

  return spanishMessages[key];
};
