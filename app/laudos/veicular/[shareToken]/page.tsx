import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import {
  getPublicReportByShareToken,
  checkInvalidAttemptRateLimit,
} from '@/lib/vehicle-lookup/share-service';
import { getSiteSettings } from '@/lib/queries/settings';
import { PublicVehicleReportView } from '@/components/public/vehicle-report/public-vehicle-report-view';

interface PageProps {
  params: Promise<{ shareToken: string }>;
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { shareToken } = await params;

  return {
    title: 'Histórico e Procedência Veicular | AF Motos',
    description: 'Relatório institucional de procedência, débitos e histórico veicular.',
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
        'max-video-preview': -1,
        'max-image-preview': 'none',
        'max-snippet': -1,
      },
    },
  };
}

export default async function PublicVehicleReportPage({ params }: PageProps) {
  const { shareToken } = await params;

  // 1. Extract request headers for rate limiting and audit
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : headersList.get('x-real-ip') || '127.0.0.1';
  const userAgent = headersList.get('user-agent') || undefined;

  // 2. Check in-memory rate limiting against brute force enumeration
  if (!checkInvalidAttemptRateLimit(clientIp)) {
    notFound();
  }

  // 3. Retrieve report by cryptographic share token & fetch site settings
  const [result, settings] = await Promise.all([
    getPublicReportByShareToken({
      shareToken,
      clientIp,
      userAgent,
    }),
    getSiteSettings(),
  ]);

  if (!result || !result.publicDto) {
    notFound();
  }

  return (
    <PublicVehicleReportView
      report={result.publicDto}
      shareToken={shareToken}
      settings={settings}
    />
  );
}

