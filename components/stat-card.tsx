import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  accent?: 'primary' | 'success' | 'warning' | 'destructive' | 'chart';
  className?: string;
}

const accentColors: Record<string, string> = {
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  destructive: 'text-destructive',
  chart: 'text-chart-1',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  description,
  accent = 'primary',
  className,
}: StatCardProps) {
  return (
    <div className={cn('group animate-fade-in', className)}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className={cn('h-3.5 w-3.5', accentColors[accent])} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
      <p className="mt-2 font-display text-3xl font-bold leading-none tracking-tight">
        {value}
      </p>
      {description && (
        <p className="mt-1.5 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
