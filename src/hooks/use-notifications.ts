"use client";

import * as React from "react";

export type NotificationCategory = "workout" | "meal" | "water" | "report";

export type NeoFitNotice = {
  id: string;
  title: string;
  description: string;
  time: string;
  category: NotificationCategory;
  read: boolean;
};

export type NotificationPreferences = Record<NotificationCategory, boolean>;

const STORAGE_KEY = "neofit:notifications:v1";
const PREFERENCES_KEY = "neofit:notification-preferences:v1";
const EVENT_NAME = "neofit:notifications-changed";
const PREFERENCES_EVENT_NAME = "neofit:notification-preferences-changed";

export const defaultNotificationPreferences: NotificationPreferences = {
  workout: true,
  meal: true,
  water: true,
  report: true,
};

export const defaultNotifications: NeoFitNotice[] = [
  { id: "workout", title: "تمرین امروز آماده است", description: "جلسه پایین‌تنه حدود ۷۰ دقیقه زمان می‌برد.", time: "امروز، ۱۸:۰۰", category: "workout", read: false },
  { id: "meal", title: "وعده بعدی", description: "میان‌وعده ماست و موز تا یک ساعت دیگر برنامه‌ریزی شده است.", time: "امروز، ۱۶:۳۰", category: "meal", read: false },
  { id: "water", title: "یادآوری آب", description: "برای رسیدن به هدف امروز، یک لیوان آب ثبت کن.", time: "۱۵ دقیقه پیش", category: "water", read: false },
  { id: "report", title: "خلاصه هفتگی", description: "گزارش پایبندی و روند تمرین برای مرور آماده است.", time: "دیروز", category: "report", read: true },
];

function readStored(): NeoFitNotice[] {
  if (typeof window === "undefined") return defaultNotifications;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultNotifications;
  } catch {
    return defaultNotifications;
  }
}

function readPreferences(): NotificationPreferences {
  if (typeof window === "undefined") return defaultNotificationPreferences;
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    return raw ? { ...defaultNotificationPreferences, ...JSON.parse(raw) } : defaultNotificationPreferences;
  } catch {
    return defaultNotificationPreferences;
  }
}

function persist(notices: NeoFitNotice[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notices));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: notices }));
}

function persistPreferences(preferences: NotificationPreferences) {
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT_NAME, { detail: preferences }));
}

export function useNotifications() {
  const [notices, setNotices] = React.useState<NeoFitNotice[]>(defaultNotifications);
  const [preferences, setPreferences] = React.useState<NotificationPreferences>(defaultNotificationPreferences);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setNotices(readStored());
    setPreferences(readPreferences());
    setIsHydrated(true);

    const noticeListener = (event: Event) => setNotices((event as CustomEvent<NeoFitNotice[]>).detail);
    const preferencesListener = (event: Event) => setPreferences((event as CustomEvent<NotificationPreferences>).detail);
    window.addEventListener(EVENT_NAME, noticeListener);
    window.addEventListener(PREFERENCES_EVENT_NAME, preferencesListener);
    return () => {
      window.removeEventListener(EVENT_NAME, noticeListener);
      window.removeEventListener(PREFERENCES_EVENT_NAME, preferencesListener);
    };
  }, []);

  const update = React.useCallback((producer: (current: NeoFitNotice[]) => NeoFitNotice[]) => {
    setNotices((current) => {
      const next = producer(current);
      persist(next);
      return next;
    });
  }, []);

  const setPreference = React.useCallback((category: NotificationCategory, enabled: boolean) => {
    setPreferences((current) => {
      const next = { ...current, [category]: enabled };
      persistPreferences(next);
      return next;
    });
  }, []);

  const markAllRead = React.useCallback(() => update((current) => current.map((notice) => ({ ...notice, read: true }))), [update]);
  const markRead = React.useCallback((id: string) => update((current) => current.map((notice) => notice.id === id ? { ...notice, read: true } : notice)), [update]);
  const remove = React.useCallback((id: string) => update((current) => current.filter((notice) => notice.id !== id)), [update]);
  const reset = React.useCallback(() => update(() => defaultNotifications), [update]);
  const unreadCount = notices.filter((notice) => !notice.read).length;

  return { notices, unreadCount, preferences, isHydrated, markAllRead, markRead, remove, reset, setPreference };
}
