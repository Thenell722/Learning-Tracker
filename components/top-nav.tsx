'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Moon, Sun, BookOpenText } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Today', short: 'Today' },
  { href: '/courses', label: 'Courses', short: 'Courses' },
  { href: '/sessions', label: 'Sessions', short: 'Study' },
  { href: '/reviews', label: 'Reviews', short: 'Reviews' },
  { href: '/notes', label: 'Notes', short: 'Notes' },
  { href: '/calendar', label: 'Calendar', short: 'Cal' },
  { href: '/statistics', label: 'Statistics', short: 'Stats' },
];

export function TopNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo / wordmark */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <BookOpenText className="h-5 w-5 text-primary" strokeWidth={2.5} />
            <span className="font-display text-xl font-bold tracking-tight">
              Learn<span className="text-primary">Track</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative px-3 py-1.5 text-sm font-medium transition-colors rounded-sm',
                  isActive(item.href)
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-px left-3 right-3 h-0.5 bg-primary" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-sm hover:bg-muted"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-sm hover:bg-muted"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="md:hidden border-t border-border py-3 flex flex-col gap-1 animate-fade-in">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-sm transition-colors',
                  isActive(item.href)
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
