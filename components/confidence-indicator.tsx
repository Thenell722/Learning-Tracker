import { cn } from '@/lib/utils';
import { confidenceLabel } from '@/lib/format';

interface ConfidenceIndicatorProps {
  level: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const levelColors: Record<number, string> = {
  1: 'text-destructive',
  2: 'text-warning',
  3: 'text-muted-foreground',
  4: 'text-success',
  5: 'text-success',
};

const barColors: Record<number, string> = {
  1: 'bg-destructive',
  2: 'bg-warning',
  3: 'bg-muted-foreground',
  4: 'bg-success',
  5: 'bg-success',
};

export function ConfidenceIndicator({
  level,
  showLabel = true,
  size = 'md',
  className,
}: ConfidenceIndicatorProps) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  const dotSize = size === 'sm' ? 'h-1.5 w-1.5' : size === 'lg' ? 'h-2.5 w-2.5' : 'h-2 w-2';

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              dotSize,
              i <= clampedLevel ? barColors[i] : 'bg-border',
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn('text-xs font-medium', levelColors[clampedLevel])}>
          {confidenceLabel(clampedLevel)}
        </span>
      )}
    </div>
  );
}
