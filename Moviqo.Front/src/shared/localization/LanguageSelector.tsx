import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent
} from "react";
import type { Language } from "./messages";
import { useLanguage } from "./LanguageProvider";

export type LanguagePopupCommand =
  | { type: "none" }
  | { type: "open"; index: number }
  | { type: "close" }
  | { type: "navigate"; index: number }
  | { type: "select"; index: number };

export const resolveLanguagePopupKey = (
  key: string,
  isOpen: boolean,
  activeIndex: number,
  optionCount: number
): LanguagePopupCommand => {
  if (optionCount < 1) return { type: "none" };
  if (key === "ArrowDown") {
    return { type: "navigate", index: isOpen ? (activeIndex + 1) % optionCount : activeIndex };
  }
  if (key === "ArrowUp") {
    return {
      type: "navigate",
      index: isOpen ? (activeIndex - 1 + optionCount) % optionCount : activeIndex
    };
  }
  if (key === "Escape" && isOpen) return { type: "close" };
  if (key === "Enter" || key === " ") {
    return isOpen ? { type: "select", index: activeIndex } : { type: "open", index: activeIndex };
  }
  return { type: "none" };
};

export const LanguageSelector = () => {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { language, languages, setLanguage, t } = useLanguage();
  const selectedIndex = Math.max(0, languages.indexOf(language));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const [isOpen, setIsOpen] = useState(false);

  const optionLabel = (option: Language) =>
    option === "en" ? t("app.language.english") : t("app.language.spanish");

  const returnFocus = () => triggerRef.current?.focus();

  const closeAndReturnFocus = () => {
    setIsOpen(false);
    returnFocus();
  };

  const selectOption = (index: number) => {
    const option = languages[index];
    if (option) setLanguage(option);
    closeAndReturnFocus();
  };

  const openPopup = () => {
    setActiveIndex(selectedIndex);
    setIsOpen(true);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    const command = resolveLanguagePopupKey(event.key, isOpen, activeIndex, languages.length);
    if (command.type === "none") return;
    event.preventDefault();
    if (command.type === "open") openPopup();
    if (command.type === "close") closeAndReturnFocus();
    if (command.type === "navigate") {
      setActiveIndex(command.index);
      setIsOpen(true);
    }
    if (command.type === "select") selectOption(command.index);
  };

  useEffect(() => {
    if (!isOpen) return undefined;
    listboxRef.current?.focus();
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnOutsideFocus = (event: FocusEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("focusin", closeOnOutsideFocus);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("focusin", closeOnOutsideFocus);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        aria-controls={listboxId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${t("app.language.label")}: ${optionLabel(language)}`}
        className="inline-grid min-h-11 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center rounded-moviqo-pill border border-moviqo-border bg-moviqo-surface-raised text-moviqo-ink-secondary transition-colors hover:border-moviqo-primary hover:bg-moviqo-surface-soft focus:outline-none focus-visible:outline-none motion-reduce:transition-none"
        data-language-trigger="true"
        onClick={() => (isOpen ? closeAndReturnFocus() : openPopup())}
        onKeyDown={handleKeyDown}
        ref={triggerRef}
        style={{ outline: "none" }}
        type="button"
      >
        <svg aria-hidden="true" className="ml-moviqo-3 size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3Z" />
        </svg>
        <span className="pl-moviqo-2 pr-moviqo-1 text-sm font-semibold text-moviqo-ink-primary">
          {optionLabel(language)}
        </span>
        <svg aria-hidden="true" className={`mr-moviqo-3 size-4 transition-transform motion-reduce:transition-none ${isOpen ? "rotate-180" : "rotate-0"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
          <path d="m7 10 5 5 5-5" />
        </svg>
      </button>
      {isOpen ? (
        <div
          aria-activedescendant={`${listboxId}-option-${activeIndex}`}
          aria-label={t("app.language.label")}
          className="absolute right-0 top-full z-50 mt-moviqo-2 grid min-w-full gap-moviqo-1 rounded-moviqo-control border border-moviqo-border bg-moviqo-surface-raised p-moviqo-1 shadow-lg focus:outline-none"
          id={listboxId}
          onKeyDown={handleKeyDown}
          ref={listboxRef}
          role="listbox"
          tabIndex={-1}
        >
          {languages.map((option, index) => (
            <button
              aria-selected={language === option}
              className={`min-h-11 rounded-moviqo-field px-moviqo-3 text-left text-sm font-semibold focus:outline-none focus-visible:outline-none ${activeIndex === index ? "bg-moviqo-surface-soft text-moviqo-primary" : "bg-moviqo-surface-raised text-moviqo-ink-primary"}`}
              id={`${listboxId}-option-${index}`}
              key={option}
              onClick={() => selectOption(index)}
              onMouseEnter={() => setActiveIndex(index)}
              role="option"
              style={{ outline: "none" }}
              tabIndex={-1}
              type="button"
            >
              <span aria-hidden="true" className="mr-moviqo-2 inline-block w-moviqo-3 text-moviqo-primary">
                {language === option ? "✓" : ""}
              </span>
              {optionLabel(option)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
