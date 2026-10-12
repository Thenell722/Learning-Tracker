'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  Flame,
  Trophy,
  CalendarCheck,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { CardSkeleton, RowSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/empty-state';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { DynamicIcon } from '@/components/dynamic-icon';
import { formatMinutes, formatHours } from '@/lib/format';
import { getColorClasses, TOPIC_STATUS_COLORS, TOPIC_STATUS_LABELS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';

interface DashboardData {
  userName: string;
  totalCourses: number;
  totalTopics: number;
  activeCourses: number;
  weekMinutes: number;
  avgQuizScore: number;
  avgConfidence: number;
  currentStreak: number;
  longestStreak: number;
  reviewsDueToday: (Topic & { course?: { id: string; title: string; color: string; icon: string } })[];
  lowConfidenceTopics: (Topic & { course?: { id: string; title: string; color: string } })[];
  recentSessions: (StudySession & { topic?: { id: string; title: string; course?: { id: string; title: string; color: string } } })[];
  weeklyData: { date: string; minutes: number; hours: number }[];
}

import type { Topic, StudySession } from '@/types';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="pt-8">
        <div className="h-8 w-48 rounded-sm bg-muted animate-pulse mb-8" />
        <RowSkeleton count={5} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="pt-8">
        <EmptyState
          icon={AlertCircle}
          title="Something went wrong"
          description={error ?? 'Unable to load your dashboard data.'}
          actionLabel="Retry"
          onAction={() => window.location.reload()}
        />
      </div>
    );
  }

  const today = format(new Date(), 'EEEE, MMMM d');
  const todayDate = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="pt-6 animate-fade-in">
      {/* Editorial masthead */}
      <div className="mb-8 border-b border-border pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {today}
        </p>
        <h1 className="mt-2 font-display text-5xl font-bold leading-[1.05] tracking-tight">
          {data.userName.split(' ')[0]},
          <span className="italic font-normal text-muted-foreground"> your day</span>
        </h1>
        <p className="mt-3 max-w-lg text-sm text-muted-foreground leading-relaxed">
          {data.reviewsDueToday.length > 0
            ? `You have ${data.reviewsDueToday.length} ${data.reviewsDueToday.length === 1 ? 'review' : 'reviews'} due today. ${data.currentStreak > 0 ? `Day ${data.currentStreak} of your streak — keep it going.` : 'Start a new streak by studying today.'}`
            : `All reviews are up to date. ${data.currentStreak > 0 ? `You're on a ${data.currentStreak}-day streak.` : 'Ready for a new study session?'}`}
        </p>
      </div>

      {/* Asymmetric main grid: large key metric + secondary metrics */}
      <div className="grid grid-cols-12 gap-px bg-border mb-8 border-y border-border">
        {/* Hero metric — current streak */}
        <div className="col-span-12 sm:col-span-5 bg-background p-6 group hover:bg-card transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-accent" />
            Current Streak
          </div>
          <p className="mt-3 font-display text-6xl font-bold leading-none tracking-tight">
            {data.currentStreak}
            <span className="text-2xl font-normal text-muted-foreground ml-1">days</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Best: {data.longestStreak} days
          </p>
        </div>

        {/* Study time this week */}
        <div className="col-span-6 sm:col-span-3 bg-background p-6 group hover:bg-card transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-success" />
            This Week
          </div>
          <p className="mt-3 font-display text-4xl font-bold leading-none tracking-tight">
            {formatHours(data.weekMinutes)}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{formatMinutes(data.weekMinutes)}</p>
        </div>

        {/* Courses */}
        <div className="col-span-6 sm:col-span-2 bg-background p-6 group hover:bg-card transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            Courses
          </div>
          <p className="mt-3 font-display text-4xl font-bold leading-none tracking-tight">
            {data.totalCourses}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">{data.activeCourses} active</p>
        </div>

        {/* Reviews due */}
        <div className="col-span-12 sm:col-span-2 bg-background p-6 group hover:bg-card transition-colors">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <CalendarCheck className="h-3.5 w-3.5 text-destructive" />
            Reviews Due
          </div>
          <p className={`mt-3 font-display text-4xl font-bold leading-none tracking-tight ${data.reviewsDueToday.length > 0 ? 'text-destructive' : 'text-success'}`}>
            {data.reviewsDueToday.length}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {data.reviewsDueToday.length > 0 ? 'Needs attention' : 'All caught up'}
          </p>
        </div>
      </div>

      {/* Two-column: weekly chart (wide) + reviews due (narrow) */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        {/* Weekly chart */}
        <div className="col-span-12 lg:col-span-8 animate-fade-in">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Study Time</h2>
            <span className="text-xs text-muted-foreground">Last 7 days · {formatHours(data.weekMinutes)} total</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.weeklyData}>
              <defs>
                <linearGradient id="weekGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}m`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '4px',
                  color: 'hsl(var(--popover-foreground))',
                  fontSize: '12px',
                }}
                formatter={(v: number) => [formatMinutes(v), 'Study Time']}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                fill="url(#weekGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Reviews due today */}
        <div className="col-span-12 lg:col-span-4 animate-fade-in stagger-1">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Due Today</h2>
            <Link href="/reviews">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground">
                All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          {data.reviewsDueToday.length === 0 ? (
            <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <Trophy className="h-5 w-5 text-success shrink-0" />
              <span>All caught up. No reviews due.</span>
            </div>
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {data.reviewsDueToday.slice(0, 5).map((topic) => {
                const colorClasses = getColorClasses(topic.course?.color ?? 'blue');
                const overdue = differenceInCalendarDays(new Date(), parseISO(topic.next_review_date!)) > 0;
                return (
                  <Link
                    key={topic.id}
                    href={`/topics/${topic.id}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 -mx-2 px-2"
                  >
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center ${colorClasses.light}`}>
                      <DynamicIcon name={topic.course?.icon ?? 'BookOpen'} className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{topic.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{topic.course?.title}</p>
                    </div>
                    {overdue && (
                      <Badge variant="destructive" className="text-[9px] px-1.5 h-4">Overdue</Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent sessions as a timeline list + needs attention */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 lg:col-span-7 animate-fade-in">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Recent Sessions</h2>
            <Link href="/sessions">
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground hover:text-foreground">
                All <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </Link>
          </div>
          {data.recentSessions.length === 0 ? (
            <EmptyState icon={Clock} title="No sessions yet" description="Start studying to log your first session." className="border-0 p-4" />
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {data.recentSessions.slice(0, 6).map((session) => {
                const colorClasses = getColorClasses(session.topic?.course?.color ?? 'blue');
                return (
                  <Link
                    key={session.id}
                    href={`/topics/${session.topic_id}`}
                    className="flex items-center gap-4 py-3 transition-colors hover:bg-muted/30 -mx-2 px-2"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center ${colorClasses.light}`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{session.topic?.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {format(parseISO(session.session_date), 'MMM d')} · {formatMinutes(session.duration_minutes)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                      <span className="text-muted-foreground">{session.confidence_before}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="font-semibold text-primary">{session.confidence_after}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="col-span-12 lg:col-span-5 animate-fade-in stagger-1">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Needs Attention</h2>
            <span className="text-xs text-muted-foreground">
              {data.lowConfidenceTopics.length} {data.lowConfidenceTopics.length === 1 ? 'topic' : 'topics'}
            </span>
          </div>
          {data.lowConfidenceTopics.length === 0 ? (
            <div className="flex items-center gap-3 py-8 text-sm text-muted-foreground">
              <Trophy className="h-5 w-5 text-success shrink-0" />
              <span>All topics are progressing well.</span>
            </div>
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {data.lowConfidenceTopics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/topics/${topic.id}`}
                  className="flex items-center gap-3 py-3 transition-colors hover:bg-muted/30 -mx-2 px-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{topic.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{topic.course?.title}</p>
                  </div>
                  <ConfidenceIndicator level={topic.confidence_level} showLabel={false} size="sm" />
                  <Badge className={`text-[9px] px-1.5 h-4 ${TOPIC_STATUS_COLORS[topic.status]}`} variant="secondary">
                    {TOPIC_STATUS_LABELS[topic.status]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Secondary metrics bar */}
      <div className="grid grid-cols-3 gap-px bg-border border-y border-border">
        <div className="bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-primary" />
            Avg Quiz
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{data.avgQuizScore}%</p>
        </div>
        <div className="bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Target className="h-3 w-3 text-chart-1" />
            Avg Confidence
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{data.avgConfidence}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
        </div>
        <div className="bg-background p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Target className="h-3 w-3 text-accent" />
            Topics
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{data.totalTopics}</p>
        </div>
      </div>
    </div>
  );
}
