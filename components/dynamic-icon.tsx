'use client';

import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface DynamicIconProps {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a lucide-react icon by its string name.
 * Falls back to BookOpen if the name doesn't match an exported icon.
 */
export function DynamicIcon({ name, className, style }: DynamicIconProps) {
  const iconMap = Icons as unknown as Record<string, LucideIcon>;
  const Icon = iconMap[name] ?? Icons.BookOpen;
  return <Icon className={className} style={style} />;
}
