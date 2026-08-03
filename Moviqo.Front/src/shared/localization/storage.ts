import { defaultLanguage, type Language } from "./messages";
import { isSupportedLanguage } from "./translator";

export const languagePreferenceStorageKey = "moviqo.language";

export type LanguagePreferenceAdapter = {
  read(): Language | null;
  write(language: Language): void;
};

export const memoryLanguagePreferenceAdapter = (
  initial: Language | null = null
): LanguagePreferenceAdapter => {
  let value = initial;

  return {
    read: () => value,
    write: (language) => {
      value = language;
    }
  };
};

export const createLocalLanguagePreferenceAdapter = (
  storage: Pick<Storage, "getItem" | "setItem"> | undefined
): LanguagePreferenceAdapter => {
  if (!storage) {
    return memoryLanguagePreferenceAdapter(defaultLanguage);
  }

  return {
    read: () => {
      try {
        const value = storage.getItem(languagePreferenceStorageKey);
        return isSupportedLanguage(value) ? value : null;
      } catch {
        return null;
      }
    },
    write: (language) => {
      try {
        storage.setItem(languagePreferenceStorageKey, language);
      } catch {
        // Local persistence is best-effort until user profile preferences exist.
      }
    }
  };
};
