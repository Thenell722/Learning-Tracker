import { cn } from '@/lib/utils';

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-3 py-4', className)}>
      <div className="h-3 w-20 rounded-sm bg-muted animate-pulse" />
      <div className="h-8 w-16 rounded-sm bg-muted animate-pulse" />
      <div className="h-3 w-32 rounded-sm bg-muted animate-pulse" />
    </div>
  );
}

export function RowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <div className="h-8 w-8 rounded-sm bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded-sm bg-muted animate-pulse" />
            <div className="h-3 w-1/2 rounded-sm bg-muted animate-pulse" />
          </div>
          <div className="h-6 w-16 rounded-sm bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}
