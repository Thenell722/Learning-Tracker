'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, MoreVertical, Pencil, Trash2, Clock, StickyNote, Award,
  Target, Calendar, BookOpen,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { SessionFormDialog } from '@/components/session-form-dialog';
import { NoteFormDialog } from '@/components/note-form-dialog';
import { QuizFormDialog } from '@/components/quiz-form-dialog';
import { TopicFormDialog } from '@/components/topic-form-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { DynamicIcon } from '@/components/dynamic-icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { coursesApi, topicsApi, sessionsApi, notesApi, quizzesApi } from '@/lib/api';
import {
  getColorClasses,
  TOPIC_STATUS_COLORS,
  TOPIC_STATUS_LABELS,
} from '@/lib/constants';
import { formatMinutes, percentage } from '@/lib/format';
import { toast } from 'sonner';
import type { Course, Topic, StudySession, Note, QuizScore } from '@/types';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';

export default function TopicDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quizzes, setQuizzes] = useState<QuizScore[]>([]);
  const [loading, setLoading] = useState(true);

  const [sessionDialog, setSessionDialog] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [noteDialog, setNoteDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [quizDialog, setQuizDialog] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<QuizScore | null>(null);
  const [topicDialog, setTopicDialog] = useState(false);

  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const t = await topicsApi.list().then((all) => all.find((x) => x.id === params.id) ?? null);
      if (!t) { setLoading(false); return; }
      setTopic(t);
      if (t) {
        const [s, n, q, c] = await Promise.all([
          sessionsApi.list(t.id),
          notesApi.list(t.id),
          quizzesApi.list(t.id),
          coursesApi.get(t.course_id),
        ]);
        setSessions(s as StudySession[]);
        setNotes(n as Note[]);
        setQuizzes(q as QuizScore[]);
        setCourse(c);
      }
    } catch {
      toast.error('Failed to load topic');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const avgQuiz = quizzes.length > 0
    ? Math.round(quizzes.reduce((sum, q) => sum + percentage(q.score, q.total_questions), 0) / quizzes.length)
    : 0;

  if (loading) {
    return (
      <div className="pt-6">
        <div className="h-6 w-32 rounded-sm bg-muted animate-pulse mb-4" />
        <div className="h-48 rounded-sm bg-muted/50 animate-pulse mb-6" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="pt-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <EmptyState icon={Target} title="Topic not found" />
      </div>
    );
  }

  const colorClasses = getColorClasses(course?.color ?? 'blue');

  const handleDeleteSession = async () => {
    if (!deleteSessionId) return;
    try { await sessionsApi.remove(deleteSessionId); toast.success('Session deleted'); setDeleteSessionId(null); loadData(); }
    catch { toast.error('Failed to delete session'); }
  };
  const handleDeleteNote = async () => {
    if (!deleteNoteId) return;
    try { await notesApi.remove(deleteNoteId); toast.success('Note deleted'); setDeleteNoteId(null); loadData(); }
    catch { toast.error('Failed to delete note'); }
  };
  const handleDeleteQuiz = async () => {
    if (!deleteQuizId) return;
    try { await quizzesApi.remove(deleteQuizId); toast.success('Quiz score deleted'); setDeleteQuizId(null); loadData(); }
    catch { toast.error('Failed to delete quiz score'); }
  };

  return (
    <div className="pt-6 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm">
        <Link href="/courses" className="text-muted-foreground hover:text-foreground transition-colors">Courses</Link>
        <span className="text-muted-foreground/50">/</span>
        {course && <Link href={`/courses/${course.id}`} className="text-muted-foreground hover:text-foreground transition-colors">{course.title}</Link>}
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium">{topic.title}</span>
      </nav>

      {/* Topic header — editorial split */}
      <div className="grid grid-cols-12 gap-6 mb-8 border-b border-border pb-8">
        <div className="col-span-12 sm:col-span-7">
          <div className="flex items-center gap-3 mb-3">
            {course && (
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center ${colorClasses.light}`}>
                <DynamicIcon name={course.icon} className="h-5 w-5" />
              </div>
            )}
            <Badge className={`text-[9px] px-1.5 h-4 ${TOPIC_STATUS_COLORS[topic.status]}`} variant="secondary">
              {TOPIC_STATUS_LABELS[topic.status]}
            </Badge>
            <ConfidenceIndicator level={topic.confidence_level} size="sm" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight leading-tight">{topic.title}</h1>
          {topic.description && <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-lg">{topic.description}</p>}
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setTopicDialog(true)}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit Topic
          </Button>
        </div>

        <div className="col-span-12 sm:col-span-5 sm:border-l sm:border-border sm:pl-6">
          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Clock className="h-3 w-3" /> Studied
              </div>
              <p className="mt-1.5 font-display text-2xl font-bold">{formatMinutes(totalMinutes)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Award className="h-3 w-3" /> Avg Score
              </div>
              <p className="mt-1.5 font-display text-2xl font-bold">{avgQuiz}<span className="text-sm font-normal text-muted-foreground">%</span></p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Award className="h-3 w-3" /> Quizzes
              </div>
              <p className="mt-1.5 font-display text-2xl font-bold">{quizzes.length}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <StickyNote className="h-3 w-3" /> Notes
              </div>
              <p className="mt-1.5 font-display text-2xl font-bold">{notes.length}</p>
            </div>
          </div>

          {topic.next_review_date && (
            <div className="mt-5 pt-4 border-t border-border flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Next review:</span>
              {(() => {
                const days = differenceInCalendarDays(parseISO(topic.next_review_date), new Date());
                const cls = days < 0 ? 'text-destructive' : days === 0 ? 'text-warning' : 'text-foreground';
                return <span className={`font-medium ${cls}`}>{format(parseISO(topic.next_review_date), 'MMM d, yyyy')} {days < 0 ? `(${Math.abs(days)}d overdue)` : days === 0 ? '(today)' : `(in ${days}d)`}</span>;
              })()}
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="sessions">
        <TabsList className="mb-6 border-b border-border bg-transparent p-0 h-auto gap-6">
          <TabsTrigger value="sessions" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 pt-0 text-sm font-medium">Sessions</TabsTrigger>
          <TabsTrigger value="notes" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 pt-0 text-sm font-medium">Notes</TabsTrigger>
          <TabsTrigger value="quizzes" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 pt-0 text-sm font-medium">Quizzes</TabsTrigger>
        </TabsList>

        {/* Sessions tab — timeline */}
        <TabsContent value="sessions">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => { setEditingSession(null); setSessionDialog(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Log Session
            </Button>
          </div>
          {sessions.length === 0 ? (
            <EmptyState icon={Clock} title="No sessions yet" description="Log your study time for this topic." actionLabel="Log Session" onAction={() => { setEditingSession(null); setSessionDialog(true); }} />
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-1">
                {sessions.map((s) => (
                  <div key={s.id} className="group relative pl-10 py-4 hover:bg-muted/20 transition-colors -mx-2 px-2 rounded-sm">
                    {/* Timeline dot */}
                    <div className="absolute left-2.5 top-6 h-3 w-3 rounded-full border-2 border-border bg-background" />
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold font-display">{format(parseISO(s.session_date), 'EEEE, MMM d')}</span>
                          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{formatMinutes(s.duration_minutes)}</Badge>
                        </div>
                        {s.summary && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.summary}</p>}
                        <div className="mt-2 flex items-center gap-2 text-xs font-mono">
                          <span className="text-muted-foreground">confidence</span>
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
                          <DropdownMenuItem onClick={() => { setEditingSession(s); setSessionDialog(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteSessionId(s.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Notes tab — stacked entries */}
        <TabsContent value="notes">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => { setEditingNote(null); setNoteDialog(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </div>
          {notes.length === 0 ? (
            <EmptyState icon={StickyNote} title="No notes yet" description="Add notes to capture key learnings." actionLabel="Add Note" onAction={() => { setEditingNote(null); setNoteDialog(true); }} />
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {notes.map((n) => (
                <div key={n.id} className="group py-5 hover:bg-muted/20 transition-colors -mx-2 px-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-lg font-semibold">{n.title}</h3>
                      {n.content && <p className="mt-1.5 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{n.content}</p>}
                      <p className="mt-3 text-xs text-muted-foreground">{format(parseISO(n.created_at), 'MMM d, yyyy')}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingNote(n); setNoteDialog(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteNoteId(n.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Quizzes tab — score entries */}
        <TabsContent value="quizzes">
          <div className="mb-4 flex justify-end">
            <Button size="sm" onClick={() => { setEditingQuiz(null); setQuizDialog(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Record Score
            </Button>
          </div>
          {quizzes.length === 0 ? (
            <EmptyState icon={Award} title="No quiz scores yet" description="Record quiz scores to track your progress." actionLabel="Record Score" onAction={() => { setEditingQuiz(null); setQuizDialog(true); }} />
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {quizzes.map((q) => {
                const pct = percentage(q.score, q.total_questions);
                const color = pct >= 80 ? 'text-success' : pct >= 60 ? 'text-warning' : 'text-destructive';
                return (
                  <div key={q.id} className="group py-5 hover:bg-muted/20 transition-colors -mx-2 px-2">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-3">
                          <span className="text-sm font-semibold font-display">{format(parseISO(q.quiz_date), 'MMM d, yyyy')}</span>
                          <span className={`font-display text-3xl font-bold ${color}`}>{pct}<span className="text-lg">%</span></span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{q.score}/{q.total_questions} correct</p>
                        {q.notes && <p className="mt-1.5 text-sm text-muted-foreground italic">{q.notes}</p>}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 shrink-0"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingQuiz(q); setQuizDialog(true); }}><Pencil className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteQuizId(q.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <SessionFormDialog open={sessionDialog} onOpenChange={setSessionDialog} defaultTopicId={topic.id} session={editingSession} onSaved={loadData} />
      <NoteFormDialog open={noteDialog} onOpenChange={setNoteDialog} topicId={topic.id} note={editingNote} onSaved={loadData} />
      <QuizFormDialog open={quizDialog} onOpenChange={setQuizDialog} defaultTopicId={topic.id} quiz={editingQuiz} onSaved={loadData} />
      <TopicFormDialog open={topicDialog} onOpenChange={setTopicDialog} courseId={topic.course_id} topic={topic} onSaved={loadData} />

      <ConfirmDialog open={!!deleteSessionId} onOpenChange={(o) => !o && setDeleteSessionId(null)} title="Delete Session?" description="This will permanently delete this study session." confirmLabel="Delete" destructive onConfirm={handleDeleteSession} />
      <ConfirmDialog open={!!deleteNoteId} onOpenChange={(o) => !o && setDeleteNoteId(null)} title="Delete Note?" description="This will permanently delete this note." confirmLabel="Delete" destructive onConfirm={handleDeleteNote} />
      <ConfirmDialog open={!!deleteQuizId} onOpenChange={(o) => !o && setDeleteQuizId(null)} title="Delete Quiz Score?" description="This will permanently delete this quiz score." confirmLabel="Delete" destructive onConfirm={handleDeleteQuiz} />
    </div>
  );
}
