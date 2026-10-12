'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number; // 0-100
  className?: string;
  indicatorClassName?: string;
  showShimmer?: boolean;
  delay?: number;
}

export function AnimatedProgress({
  value,
  className,
  indicatorClassName,
  showShimmer = false,
  delay = 100,
}: AnimatedProgressProps) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(Math.max(0, Math.min(100, value))), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className={cn('relative h-1 w-full overflow-hidden bg-border', className)}>
      <div
        className={cn(
          'h-full bg-primary transition-all duration-700 ease-out',
          showShimmer && 'animate-progress bg-gradient-to-r from-primary via-primary/70 to-primary',
          indicatorClassName,
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
