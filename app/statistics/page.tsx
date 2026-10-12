'use client';

import { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { Clock, Award, Target, TrendingUp, Flame, BookOpen, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatCard } from '@/components/stat-card';
import { CardSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/empty-state';
import { Badge } from '@/components/ui/badge';
import { formatMinutes } from '@/lib/format';
import { COURSE_COLORS } from '@/lib/constants';

interface StatsData {
  totalMinutes: number;
  totalSessions: number;
  avgQuizScore: number;
  avgConfidence: number;
  activeCourses: number;
  weeklyData: { label: string; minutes: number; hours: number }[];
  monthlyData: { label: string; minutes: number; hours: number }[];
  quizTrendData: { date: string; score: number; topic: string }[];
  confidenceData: { date: string; before: number; after: number }[];
  timePerCourse: { name: string; color: string; minutes: number; hours: number }[];
}

const CHART_KEYS = ['1', '2', '3', '4', '5'] as const;
const PIE_COLORS = COURSE_COLORS.map(() => {
  const key = CHART_KEYS[Math.floor(Math.random() * CHART_KEYS.length)];
  return `hsl(var(--chart-${key}))`;
});

export default function StatisticsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/statistics')
      .then((r) => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeader title="Statistics" description="Your learning analytics over time." />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <PageHeader title="Statistics" />
        <EmptyState icon={AlertCircle} title="Something went wrong" description={error ?? 'Unable to load statistics.'} actionLabel="Retry" onAction={() => window.location.reload()} />
      </div>
    );
  }

  const chartTooltipStyle = {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '4px',
    color: 'hsl(var(--popover-foreground))',
    fontSize: '12px',
  };

  const getColorValue = (name: string) => {
    const c = COURSE_COLORS.find((x) => x.name === name);
    if (!c) return 'hsl(var(--chart-1))';
    const colorMap: Record<string, string> = {
      blue: 'hsl(199 89% 55%)',
      green: 'hsl(142 71% 45%)',
      orange: 'hsl(24 90% 55%)',
      red: 'hsl(0 72% 55%)',
      purple: 'hsl(265 85% 65%)',
      cyan: 'hsl(190 85% 50%)',
      pink: 'hsl(330 80% 60%)',
      amber: 'hsl(38 92% 55%)',
      teal: 'hsl(170 70% 45%)',
      indigo: 'hsl(240 70% 60%)',
    };
    return colorMap[name] ?? 'hsl(var(--chart-1))';
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Statistics" description="Your learning analytics over time." />

      {/* Stats row — editorial metric bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border border-y border-border mb-10">
        <div className="bg-background p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Clock className="h-3 w-3 text-primary" /> Total Time
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{formatMinutes(data.totalMinutes)}</p>
        </div>
        <div className="bg-background p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-chart-1" /> Sessions
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{data.totalSessions}</p>
        </div>
        <div className="bg-background p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Award className="h-3 w-3 text-success" /> Avg Quiz
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{data.avgQuizScore}<span className="text-sm font-normal text-muted-foreground">%</span></p>
        </div>
        <div className="bg-background p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Target className="h-3 w-3 text-warning" /> Avg Confidence
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{data.avgConfidence}<span className="text-sm font-normal text-muted-foreground">/5</span></p>
        </div>
        <div className="bg-background p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <BookOpen className="h-3 w-3 text-primary" /> Active
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{data.activeCourses}</p>
        </div>
        <div className="bg-background p-4">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <Flame className="h-3 w-3 text-destructive" /> Streak
          </div>
          <p className="mt-2 font-display text-2xl font-bold">—</p>
        </div>
      </div>

      {/* Weekly study time — full width */}
      <div className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Weekly Study Time</h2>
          <span className="text-xs text-muted-foreground">Last 12 weeks</span>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data.weeklyData}>
            <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}h`, 'Study Time']} />
            <Bar dataKey="hours" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly + Quiz trends — side by side */}
      <div className="grid grid-cols-12 gap-8 mb-10">
        <div className="col-span-12 lg:col-span-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Monthly Study Time</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data.monthlyData}>
              <defs>
                <linearGradient id="monthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}h`, 'Study Time']} />
              <Area type="monotone" dataKey="hours" stroke="hsl(var(--chart-2))" strokeWidth={2} fill="url(#monthGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-12 lg:col-span-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Quiz Score Trends</h2>
            <span className="text-xs text-muted-foreground">Over time</span>
          </div>
          {data.quizTrendData.length === 0 ? (
            <EmptyState icon={Award} title="No quiz data" description="Record quiz scores to see trends." className="border-0 p-4" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.quizTrendData}>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [`${v}%`, 'Score']} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Confidence growth + Time per course — side by side */}
      <div className="grid grid-cols-12 gap-8 mb-10">
        <div className="col-span-12 lg:col-span-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Confidence Growth</h2>
            <span className="text-xs text-muted-foreground">Before & after sessions</span>
          </div>
          {data.confidenceData.length === 0 ? (
            <EmptyState icon={Target} title="No data yet" description="Log sessions with confidence ratings to see growth." className="border-0 p-4" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.confidenceData}>
                <CartesianGrid strokeDasharray="2 4" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 5]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="before" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Before" />
                <Line type="monotone" dataKey="after" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 3 }} name="After" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="col-span-12 lg:col-span-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Time Per Course</h2>
            <span className="text-xs text-muted-foreground">Distribution</span>
          </div>
          {data.timePerCourse.length === 0 ? (
            <EmptyState icon={BookOpen} title="No data yet" description="Log study sessions to see time distribution." className="border-0 p-4" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.timePerCourse}
                  dataKey="minutes"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={(entry) => `${entry.name} (${formatMinutes(entry.minutes as number)})`}
                  labelLine={false}
                >
                  {data.timePerCourse.map((entry, i) => (
                    <Cell key={i} fill={getColorValue(entry.color)} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [formatMinutes(v), 'Study Time']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
