export type LanguageCode = "fr" | "en" | "sw" | "ha" | "yo" | "ar" | "ru" | "zh" | "de";

export type I18nContextValue = {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: (key: string) => string;
  available: { code: LanguageCode; label: string }[];
};

