import React from 'react';
import { cn } from '@/lib/utils';

export type SkeletonVariant =
  'default' | 'text' | 'image' | 'card' | 'list' | 'button' | 'avatar' | 'input';

export type ResponsiveMode = 'all' | 'mobileOnly' | 'desktopOnly';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
  animate?: boolean;
  aspectRatio?: '16/10' | '4/3' | '1/1' | '21/9' | string;
  responsiveMode?: ResponsiveMode;
  label?: string;
}

const variantStyles: Record<SkeletonVariant, string> = {
  default: 'rounded-md',
  text: 'h-4 w-full rounded',
  image: 'aspect-[16/10] w-full rounded-2xl',
  card: 'rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4',
  list: 'h-14 w-full rounded-xl',
  button: 'h-11 w-32 rounded-xl',
  avatar: 'h-10 w-10 rounded-full',
  input: 'h-11 w-full rounded-xl border border-zinc-800 bg-zinc-900/50',
};

const aspectRatioStyles: Record<string, string> = {
  '16/10': 'aspect-[16/10]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '21/9': 'aspect-[21/9]',
};

function Skeleton({
  className,
  variant = 'default',
  animate = true,
  aspectRatio,
  responsiveMode = 'all',
  label,
  ...props
}: SkeletonProps) {
  const responsiveClass =
    responsiveMode === 'mobileOnly'
      ? 'block md:hidden'
      : responsiveMode === 'desktopOnly'
        ? 'hidden md:block'
        : '';

  const ratioClass = aspectRatio ? aspectRatioStyles[aspectRatio] || `aspect-[${aspectRatio}]` : '';

  // Se um label for fornecido, age como status; caso contrário, é puramente visual (aria-hidden)
  const isAriaStatus = Boolean(label);

  return (
    <div
      data-slot="skeleton"
      role={isAriaStatus ? 'status' : undefined}
      aria-busy={isAriaStatus ? 'true' : undefined}
      aria-label={label}
      aria-hidden={isAriaStatus ? undefined : true}
      className={cn(
        'relative overflow-hidden bg-zinc-900/80 select-none',
        animate && 'animate-shimmer',
        variantStyles[variant],
        ratioClass,
        responsiveClass,
        className,
      )}
      {...props}
    >
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

export { Skeleton };
