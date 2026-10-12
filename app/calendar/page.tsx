'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CalendarCheck } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { sessionsApi, reviewsApi } from '@/lib/api';
import { getColorClasses } from '@/lib/constants';
import { formatMinutes } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { StudySessionWithTopic, Topic, Course } from '@/types';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday,
  addMonths, subMonths, parseISO, isSameDay,
} from 'date-fns';

type ReviewTopic = Topic & { course?: Pick<Course, 'id' | 'title' | 'color' | 'icon'> };

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [sessions, setSessions] = useState<StudySessionWithTopic[]>([]);
  const [reviews, setReviews] = useState<ReviewTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([
        sessionsApi.list(),
        reviewsApi.list('upcoming'),
      ]);
      setSessions(s as StudySessionWithTopic[]);
      const dueReviews = await reviewsApi.list('due');
      setReviews([...(r as ReviewTopic[]), ...(dueReviews as ReviewTopic[])]);
    } catch {
      // non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const firstDayOfWeek = monthStart.getDay();
  const paddedDays: (Date | null)[] = [
    ...Array.from({ length: firstDayOfWeek }).map(() => null),
    ...days,
  ];

  const getSessionsForDay = (date: Date) =>
    sessions.filter((s) => isSameDay(parseISO(s.session_date), date));

  const getReviewsForDay = (date: Date) =>
    reviews.filter((r) => r.next_review_date && isSameDay(parseISO(r.next_review_date), date));

  const selectedSessions = selectedDate ? getSessionsForDay(selectedDate) : [];
  const selectedReviews = selectedDate ? getReviewsForDay(selectedDate) : [];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <PageHeader title="Calendar" description="Study sessions and review dates at a glance." />

      {loading ? (
        <div className="h-96 animate-pulse bg-muted/30 border-y border-border" />
      ) : (
        <div className="grid grid-cols-12 gap-8 animate-fade-in">
          {/* Calendar grid */}
          <div className="col-span-12 lg:col-span-8">
            <div className="mb-6 flex items-baseline justify-between border-b border-border pb-4">
              <h2 className="font-display text-3xl font-bold tracking-tight">{format(currentMonth, 'MMMM')}</h2>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground mr-3">{format(currentMonth, 'yyyy')}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8" onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date()); }}>
                  Today
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-border border border-border">
              {weekDays.map((d) => (
                <div key={d} className="bg-background text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground py-2">{d}</div>
              ))}
              {paddedDays.map((date, i) => {
                if (!date) return <div key={`pad-${i}`} className="bg-background min-h-[72px]" />;
                const daySessions = getSessionsForDay(date);
                const dayReviews = getReviewsForDay(date);
                const hasActivity = daySessions.length > 0 || dayReviews.length > 0;
                const inMonth = isSameMonth(date, currentMonth);
                const today = isToday(date);
                const isSelected = selectedDate && isSameDay(date, selectedDate);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      'bg-background min-h-[72px] p-2 text-left transition-colors relative',
                      !inMonth && 'opacity-30',
                      isSelected ? 'ring-2 ring-primary ring-inset z-10' : 'hover:bg-muted/30',
                      today && !isSelected && 'bg-primary/5',
                    )}
                  >
                    <span className={cn(
                      'text-xs font-medium',
                      today ? 'text-primary font-bold' : inMonth ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {format(date, 'd')}
                    </span>
                    {hasActivity && (
                      <div className="absolute bottom-1.5 left-1.5 flex flex-wrap gap-0.5">
                        {daySessions.length > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-chart-1" />
                        )}
                        {dayReviews.length > 0 && (
                          <span className="h-1.5 w-1.5 rounded-full bg-chart-3" />
                        )}
                      </div>
                    )}
                    {daySessions.length > 0 && inMonth && (
                      <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-chart-1 tabular-nums">
                        {daySessions.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-1" /> Study Session</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-chart-3" /> Review Due</span>
            </div>
          </div>

          {/* Day detail panel */}
          <div className="col-span-12 lg:col-span-4 lg:border-l lg:border-border lg:pl-8">
            <h3 className="font-display text-2xl font-bold mb-1">
              {selectedDate ? format(selectedDate, 'EEEE') : 'Select a Day'}
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Click a day on the calendar to see details.'}
            </p>
            {!selectedDate ? (
              <EmptyState icon={CalendarIcon} title="No day selected" description="Click a day on the calendar to see details." className="border-0 p-2" />
            ) : selectedSessions.length === 0 && selectedReviews.length === 0 ? (
              <EmptyState icon={CalendarIcon} title="Nothing scheduled" description="No sessions or reviews on this day." className="border-0 p-2" />
            ) : (
              <div className="space-y-6">
                {selectedSessions.length > 0 && (
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" /> Sessions ({selectedSessions.length})
                    </p>
                    <div className="space-y-3">
                      {selectedSessions.map((s) => {
                        const colorClasses = getColorClasses(s.topic?.course?.color ?? 'blue');
                        return (
                          <Link key={s.id} href={`/topics/${s.topic_id}`} className="flex items-center gap-3 transition-colors hover:bg-muted/30 -mx-2 px-2 py-2 rounded-sm">
                            <div className={`flex h-8 w-8 items-center justify-center ${colorClasses.light}`}>
                              <Clock className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{s.topic?.title}</p>
                              <p className="text-xs text-muted-foreground">{formatMinutes(s.duration_minutes)}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
                {selectedReviews.length > 0 && (
                  <div>
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground flex items-center gap-1.5">
                      <CalendarCheck className="h-3 w-3" /> Reviews ({selectedReviews.length})
                    </p>
                    <div className="space-y-3">
                      {selectedReviews.map((r) => {
                        const colorClasses = getColorClasses(r.course?.color ?? 'blue');
                        return (
                          <Link key={r.id} href={`/topics/${r.id}`} className="flex items-center gap-3 transition-colors hover:bg-muted/30 -mx-2 px-2 py-2 rounded-sm">
                            <div className={`flex h-8 w-8 items-center justify-center ${colorClasses.light}`}>
                              <CalendarCheck className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{r.title}</p>
                              <p className="text-xs text-muted-foreground">{r.course?.title}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
