'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Clock, MoreVertical, Pencil, Trash2, Play, Pause, Square, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { SessionFormDialog } from '@/components/session-form-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { RowSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sessionsApi, topicsApi } from '@/lib/api';
import { getColorClasses } from '@/lib/constants';
import { formatMinutes } from '@/lib/format';
import { toast } from 'sonner';
import type { StudySessionWithTopic, Topic } from '@/types';
import { format, parseISO } from 'date-fns';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<StudySessionWithTopic[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySessionWithTopic | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Timer state
  const [timerTopic, setTimerTopic] = useState('');
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([sessionsApi.list(), topicsApi.list()]);
      setSessions(s as StudySessionWithTopic[]);
      setTopics(t);
    } catch {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const formatTimer = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h > 0 ? String(h).padStart(2, '0') + ':' : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const handleTimerLog = async () => {
    if (!timerTopic) {
      toast.error('Select a topic first');
      return;
    }
    if (seconds < 60) {
      toast.error('Study for at least 1 minute before logging');
      return;
    }
    const minutes = Math.round(seconds / 60);
    try {
      await sessionsApi.create({
        topic_id: timerTopic,
        session_date: format(new Date(), 'yyyy-MM-dd'),
        duration_minutes: minutes,
        summary: `Studied for ${formatMinutes(minutes)} via timer.`,
        confidence_before: 1,
        confidence_after: 1,
      });
      toast.success(`Logged ${formatMinutes(minutes)} session!`);
      setSeconds(0);
      setRunning(false);
      loadData();
    } catch {
      toast.error('Failed to log session');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await sessionsApi.remove(deleteId); toast.success('Session deleted'); setDeleteId(null); loadData(); }
    catch { toast.error('Failed to delete session'); }
  };

  return (
    <div>
      <PageHeader title="Study Sessions" description="Track time spent studying and review your session history.">
        <Button onClick={() => { setEditingSession(null); setDialogOpen(true); }} size="sm">
          <Plus className="mr-2 h-4 w-4" /> Log Manually
        </Button>
      </PageHeader>

      {/* Timer hero — prominent, full-width */}
      <div className="mb-10 border-y border-border py-8 animate-fade-in">
        <div className="grid grid-cols-12 gap-6 items-center">
          {/* Topic selector */}
          <div className="col-span-12 sm:col-span-5">
            <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Studying
            </Label>
            <Select value={timerTopic} onValueChange={setTimerTopic}>
              <SelectTrigger className="border-border"><SelectValue placeholder="Select a topic" /></SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timer display */}
          <div className="col-span-12 sm:col-span-4 text-center">
            <p className="font-display text-6xl font-bold tabular-nums tracking-tight leading-none">
              {formatTimer(seconds)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground uppercase tracking-[0.12em]">
              {running ? 'Recording' : seconds > 0 ? 'Paused' : 'Ready'}
            </p>
          </div>

          {/* Controls */}
          <div className="col-span-12 sm:col-span-3 flex items-center justify-end gap-2">
            {!running ? (
              <Button size="icon" onClick={() => setRunning(true)} className="h-12 w-12 bg-success hover:bg-success/90">
                <Play className="h-5 w-5" />
              </Button>
            ) : (
              <Button size="icon" onClick={() => setRunning(false)} className="h-12 w-12 bg-warning hover:bg-warning/90">
                <Pause className="h-5 w-5" />
              </Button>
            )}
            <Button size="icon" variant="outline" onClick={() => { setRunning(false); setSeconds(0); }} className="h-10 w-10">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button onClick={handleTimerLog} disabled={seconds < 60} className="h-12 px-4">
              <Square className="mr-2 h-4 w-4" /> Log
            </Button>
          </div>
        </div>
      </div>

      {/* Session history — grouped by date */}
      {loading ? (
        <RowSkeleton count={5} />
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No sessions yet"
          description="Use the timer above or log a session manually to start tracking."
          actionLabel="Log Session"
          onAction={() => { setEditingSession(null); setDialogOpen(true); }}
        />
      ) : (
        <div className="animate-fade-in">
          <h2 className="font-display text-xl font-semibold mb-4">History</h2>
          <div className="divide-y divide-border border-y border-border">
            {sessions.map((s) => {
              const colorClasses = getColorClasses(s.topic?.course?.color ?? 'blue');
              return (
                <div key={s.id} className="group py-4 hover:bg-muted/20 transition-colors -mx-2 px-2">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${colorClasses.light}`}>
                      <Clock className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium text-sm">{s.topic?.title ?? 'Unknown topic'}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {format(parseISO(s.session_date), 'EEE, MMM d')} · {s.topic?.course?.title}
                      </p>
                      {s.summary && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{s.summary}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{formatMinutes(s.duration_minutes)}</Badge>
                        <div className="mt-1 flex items-center gap-1 text-xs font-mono">
                          <span className="text-muted-foreground">{s.confidence_before}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-semibold text-primary">{s.confidence_after}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingSession(s); setDialogOpen(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <SessionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} session={editingSession} onSaved={loadData} />
      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)} title="Delete Session?" description="This will permanently delete this study session." confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  );
}
