export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatHours(minutes: number): string {
  return `${(minutes / 60).toFixed(1)}h`;
}

export function percentage(score: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((score / total) * 100);
}

export function confidenceLabel(level: number): string {
  return ['Very Low', 'Low', 'Medium', 'High', 'Very High'][level - 1] ?? '—';
}

export function confidenceColor(level: number): string {
  const colors = [
    'text-red-500',
    'text-orange-500',
    'text-yellow-500',
    'text-lime-500',
    'text-emerald-500',
  ];
  return colors[level - 1] ?? 'text-muted-foreground';
}

export function confidenceBg(level: number): string {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-emerald-500',
  ];
  return colors[level - 1] ?? 'bg-muted';
}
