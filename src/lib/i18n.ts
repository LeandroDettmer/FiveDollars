import { useCallback } from "react";
import { useAppStore } from "@/store/useAppStore";
import { en, type TranslationKeys } from "@/locales/en";
import { ptBR } from "@/locales/pt-BR";

export type Locale = "en" | "pt-BR";

const translations: Record<Locale, Record<string, string>> = {
  en: { ...en },
  "pt-BR": { ...ptBR },
};

/**
 * Returns the translations object for the given locale. Falls back to "en" for missing keys.
 */
export function getTranslations(locale: Locale): Record<TranslationKeys, string> {
  const primary = translations[locale] ?? en;
  const fallback = translations.en ?? en;
  const merged: Record<string, string> = {};
  for (const key of Object.keys(en) as TranslationKeys[]) {
    merged[key] = primary[key] ?? fallback[key] ?? (en as Record<string, string>)[key] ?? key;
  }
  return merged as Record<TranslationKeys, string>;
}

/**
 * Replaces {key} placeholders in str with values from params.
 */
function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? `{${key}}`));
}

/**
 * Get a single message by key and locale (for use outside React, e.g. store, lib).
 */
export function getMessage(
  locale: Locale,
  key: TranslationKeys,
  params?: Record<string, string | number>
): string {
  const tr = getTranslations(locale);
  const raw = tr[key] ?? (en as Record<string, string>)[key] ?? key;
  return interpolate(raw, params);
}

/**
 * Default name for a new request (used by store when creating temp request or new request in collection).
 */
export function getDefaultNewRequestName(locale: Locale): string {
  return getMessage(locale, "sidebar.newRequest");
}

/**
 * Hook that returns t(key) and current locale. Use in components.
 * t() supports interpolation: t("about.newVersionAvailable", { version: "1.0" })
 */
export function useT(): {
  t: (key: TranslationKeys, params?: Record<string, string | number>) => string;
  locale: Locale;
} {
  const locale = useAppStore((s) => (s.locale ?? "en") as Locale);
  const t = useCallback(
    (key: TranslationKeys, params?: Record<string, string | number>) => {
      const tr = getTranslations(locale);
      const raw = tr[key] ?? (en as Record<string, string>)[key] ?? key;
      return interpolate(raw, params);
    },
    [locale]
  );
  return { t, locale };
}
