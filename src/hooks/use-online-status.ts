"use client";

import * as React from "react";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = React.useState(true);
  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setIsOnline(window.navigator.onLine);
    sync();
    setIsHydrated(true);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return { isOnline, isHydrated };
}
