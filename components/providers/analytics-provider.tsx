'use client';

import { useAnalytics } from '@/lib/hooks/use-analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useAnalytics();
  return <>{children}</>;
}
