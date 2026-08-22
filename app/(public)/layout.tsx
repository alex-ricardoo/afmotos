import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { WhatsAppButton } from '@/components/layout/whatsapp-button';
import { Toaster } from '@/components/ui/sonner';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';

import { getSettings } from '@/lib/actions/settings';

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();

  return (
    <>
      <Header settings={settings} />
      <AnalyticsProvider>
        <main className="flex-1">{children}</main>
        <Toaster />
      </AnalyticsProvider>
      <WhatsAppButton settings={settings} />
      <Footer settings={settings} />
    </>
  );
}
