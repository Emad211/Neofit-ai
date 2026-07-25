'use client';

import * as React from 'react';
import { dictionaries, Locale, TranslationKey } from '@/i18n/dictionaries';

const STORAGE_KEY = 'neofit-locale';
const COOKIE_NAME = 'neofit_locale';

type TranslationValues = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  direction: 'ltr' | 'rtl';
  hasChosenLocale: boolean;
  isReady: boolean;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, values?: TranslationValues) => string;
};

const I18nContext = React.createContext<I18nContextValue | null>(null);

function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'fa';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>('en');
  const [hasChosenLocale, setHasChosenLocale] = React.useState(false);
  const [isReady, setIsReady] = React.useState(false);

  const applyDocumentLocale = React.useCallback((nextLocale: Locale) => {
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === 'fa' ? 'rtl' : 'ltr';
  }, []);

  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) {
      setLocaleState(stored);
      setHasChosenLocale(true);
      applyDocumentLocale(stored);
    } else {
      const suggested: Locale = navigator.language.toLowerCase().startsWith('fa') ? 'fa' : 'en';
      setLocaleState(suggested);
      applyDocumentLocale(suggested);
    }
    setIsReady(true);
  }, [applyDocumentLocale]);

  const setLocale = React.useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    setHasChosenLocale(true);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    document.cookie = `${COOKIE_NAME}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    applyDocumentLocale(nextLocale);
  }, [applyDocumentLocale]);

  const t = React.useCallback((key: TranslationKey, values?: TranslationValues) => {
    const dictionary = dictionaries[locale] as Record<TranslationKey, string>;
    let message = dictionary[key] || dictionaries.en[key] || key;
    if (values) {
      for (const [name, value] of Object.entries(values)) {
        message = message.replaceAll(`{${name}}`, String(value));
      }
    }
    return message;
  }, [locale]);

  const value = React.useMemo<I18nContextValue>(() => ({
    locale,
    direction: locale === 'fa' ? 'rtl' : 'ltr',
    hasChosenLocale,
    isReady,
    setLocale,
    t,
  }), [locale, hasChosenLocale, isReady, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used within LocaleProvider.');
  return context;
}
