import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { getSiteSettings } from '@/lib/queries/settings';
import { getSiteLogo, getSiteName } from '@/lib/site-settings';

export default async function Loading() {
  const settings = await getSiteSettings();
  const logoInfo = getSiteLogo(settings as any);
  const siteName = getSiteName(settings);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="relative flex flex-col items-center gap-5 rounded-lg border border-amber-500/20 bg-zinc-950/80 px-8 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-sm">
        <div className="absolute inset-0 rounded-lg bg-[radial-gradient(circle_at_top,rgba(201,164,76,0.16),transparent_58%)]" />
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-amber-400/40 bg-zinc-950 shadow-[0_0_28px_rgba(201,164,76,0.22)]">
          <Image
            src={logoInfo.src}
            alt={logoInfo.alt || siteName}
            fill
            sizes="80px"
            className="object-cover"
            priority
            unoptimized={logoInfo.isCustom}
          />
        </div>

        <div className="relative flex items-center gap-3 text-amber-200">
          <Loader2 className="h-4 w-4 animate-spin" />
          <p className="text-sm font-semibold uppercase tracking-[0.22em]">Carregando</p>
        </div>
        <div className="relative h-px w-28 bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
      </div>
    </div>
  );
}
