'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, defaultChecked, onCheckedChange, disabled, onClick, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false);

    const currentChecked = checked !== undefined ? checked : isChecked;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const nextChecked = !currentChecked;
      if (checked === undefined) {
        setIsChecked(nextChecked);
      }
      onCheckedChange?.(nextChecked);
      onClick?.(e);
    };

    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={currentChecked}
        data-state={currentChecked ? 'checked' : 'unchecked'}
        disabled={disabled}
        ref={ref}
        onClick={handleClick}
        className={cn(
          'peer h-5 w-5 shrink-0 rounded-md border border-slate-700 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-slate-950 flex items-center justify-center transition-colors',
          className,
        )}
        {...props}
      >
        {currentChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
      </button>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };
