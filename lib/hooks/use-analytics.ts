'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      // Log page view
      fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'page_view',
          path: pathname,
          url: window.location.href,
        }),
      }).catch(console.error);
    }
  }, [pathname]);

  const logEvent = async (eventName: string, metadata?: any) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventName,
          path: window.location.pathname,
          url: window.location.href,
          metadata,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return { logEvent };
}
