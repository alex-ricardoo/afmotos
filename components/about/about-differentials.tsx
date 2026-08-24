import * as LucideIcons from 'lucide-react';
import { StoreDifferential } from '@/types/site-settings';
import { cn } from '@/lib/utils';
import { CONSTANTS } from '@/lib/utils/constants';

interface AboutDifferentialsProps {
  differentials: StoreDifferential[];
  siteName?: string;
}

export function AboutDifferentials({ differentials, siteName }: AboutDifferentialsProps) {
  const storeName = siteName || CONSTANTS.STORE_NAME;
  const activeDifferentials = differentials
    .filter((d) => d.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (activeDifferentials.length === 0) {
    return null;
  }

  return (
    <section className="w-full bg-zinc-50 dark:bg-zinc-900/50 py-16 md:py-24 border-y border-zinc-200 dark:border-zinc-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
            Nossos Diferenciais
          </h2>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Por que escolher a {storeName} para o seu próximo negócio.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {activeDifferentials.map((diff) => {
            // Dynamically get the icon component from Lucide
            const IconComponent = (LucideIcons as any)[diff.icon] || LucideIcons.CheckCircle;

            return (
              <div
                key={diff.id}
                className={cn(
                  "flex flex-col items-center text-center p-6 rounded-2xl",
                  "bg-white dark:bg-zinc-950",
                  "border border-zinc-100 dark:border-zinc-800",
                  "shadow-sm transition-shadow hover:shadow-md"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-500 mb-6">
                  <IconComponent className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-3">
                  {diff.title}
                </h3>
                {diff.description && (
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                    {diff.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
