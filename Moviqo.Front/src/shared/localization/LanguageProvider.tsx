import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { defaultLanguage, type Language, supportedLanguages } from "./messages";
import {
  createLocalLanguagePreferenceAdapter,
  type LanguagePreferenceAdapter
} from "./storage";
import { isSupportedLanguage, resolveInitialLanguage, translate, type MoviqoTranslator } from "./translator";

type LanguageContextValue = {
  language: Language;
  languages: readonly Language[];
  setLanguage(language: Language): void;
  t: MoviqoTranslator;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: defaultLanguage,
  languages: supportedLanguages,
  setLanguage: () => undefined,
  t: (key) => translate(defaultLanguage, key)
});

type LanguageProviderProps = {
  children: ReactNode;
  adapter?: LanguagePreferenceAdapter;
  browserLanguages?: readonly string[];
};

const defaultAdapter = () => {
  return createLocalLanguagePreferenceAdapter(
    typeof window === "undefined" ? undefined : window.localStorage
  );
};

const defaultBrowserLanguages = () => {
  if (typeof navigator === "undefined") {
    return [];
  }

  return navigator.languages.length > 0 ? navigator.languages : [navigator.language];
};

const requestedLanguage = () => {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("lang");
  return isSupportedLanguage(value) ? value : null;
};

export const LanguageProvider = ({
  children,
  adapter = defaultAdapter(),
  browserLanguages = defaultBrowserLanguages()
}: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() =>
    requestedLanguage() ?? resolveInitialLanguage(adapter.read(), browserLanguages)
  );

  const value = useMemo<LanguageContextValue>(() => {
    const setLanguage = (nextLanguage: Language) => {
      adapter.write(nextLanguage);
      setLanguageState(nextLanguage);
    };

    return {
      language,
      languages: supportedLanguages,
      setLanguage,
      t: (key) => translate(language, key)
    };
  }, [adapter, language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  return useContext(LanguageContext);
};
