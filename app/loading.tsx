import Image from 'next/image';
import { Loader2 } from 'lucide-react';

export default function RootLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Carregando..."
      className="flex min-h-[60vh] items-center justify-center px-4"
    >
      <div className="relative flex flex-col items-center gap-5 rounded-2xl border border-amber-500/20 bg-zinc-950/80 px-8 py-7 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
        <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,rgba(201,164,76,0.16),transparent_60%)]" />

        {/* Logo Container with Shimmer Border */}
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-amber-400/40 bg-zinc-950 shadow-[0_0_28px_rgba(201,164,76,0.25)]">
          <Image
            src="/aflogo.jpg"
            alt="AF Motos"
            fill
            sizes="80px"
            className="object-cover"
            priority
          />
        </div>

        {/* Indicator */}
        <div className="relative flex items-center gap-3 text-amber-200">
          <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-zinc-100">Carregando</p>
        </div>

        {/* Golden line with shimmer */}
        <div className="relative h-[2px] w-28 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-full animate-shimmer bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />
        </div>
      </div>
      <span className="sr-only">Carregando conteúdo da página...</span>
    </div>
  );
}
