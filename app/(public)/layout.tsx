import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { WhatsAppButton } from '@/components/layout/whatsapp-button';
import { Toaster } from '@/components/ui/sonner';
import { AnalyticsProvider } from '@/components/providers/analytics-provider';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <AnalyticsProvider>
        <main className="flex-1">{children}</main>
        <Toaster />
      </AnalyticsProvider>
      <WhatsAppButton />
      <Footer />
    </>
  );
}
