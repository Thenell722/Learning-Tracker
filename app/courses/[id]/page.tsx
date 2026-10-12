'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Plus, MoreVertical, Pencil, Trash2, BookOpen, Clock, Target,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { TopicFormDialog } from '@/components/topic-form-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { DynamicIcon } from '@/components/dynamic-icon';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { AnimatedProgress } from '@/components/animated-progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { coursesApi, topicsApi, sessionsApi } from '@/lib/api';
import {
  getColorClasses,
  COURSE_STATUS_COLORS,
  TOPIC_STATUS_COLORS,
  TOPIC_STATUS_LABELS,
} from '@/lib/constants';
import { formatMinutes } from '@/lib/format';
import { toast } from 'sonner';
import type { Course, Topic, StudySession } from '@/types';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [c, t, s] = await Promise.all([
        coursesApi.get(params.id),
        topicsApi.list(params.id),
        sessionsApi.list(),
      ]);
      setCourse(c);
      setTopics(t);
      setSessions(s ?? []);
    } catch {
      toast.error('Failed to load course');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteTopic = async () => {
    if (!deleteTopicId) return;
    try {
      await topicsApi.remove(deleteTopicId);
      toast.success('Topic deleted');
      setDeleteTopicId(null);
      loadData();
    } catch {
      toast.error('Failed to delete topic');
    }
  };

  if (loading) {
    return (
      <div className="pt-6">
        <div className="h-6 w-32 rounded-sm bg-muted animate-pulse mb-4" />
        <div className="h-48 rounded-sm bg-muted/50 animate-pulse mb-6" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="pt-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => router.push('/courses')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <EmptyState icon={BookOpen} title="Course not found" />
      </div>
    );
  }

  const colorClasses = getColorClasses(course.color);
  const topicIds = topics.map((t) => t.id);
  const courseSessions = sessions.filter((s) => topicIds.includes(s.topic_id));
  const totalMinutes = courseSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const progress = course.target_hours > 0
    ? Math.min(100, (totalMinutes / 60 / course.target_hours) * 100)
    : 0;
  const masteredCount = topics.filter((t) => t.status === 'Mastered').length;

  return (
    <div className="pt-6 animate-fade-in">
      <button
        onClick={() => router.push('/courses')}
        className="mb-6 text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> All Courses
      </button>

      {/* Editorial header — asymmetric split */}
      <div className="grid grid-cols-12 gap-6 mb-8 border-b border-border pb-8">
        <div className="col-span-12 sm:col-span-7">
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center ${colorClasses.light}`}>
              <DynamicIcon name={course.icon} className="h-6 w-6" />
            </div>
            <Badge className={COURSE_STATUS_COLORS[course.status]} variant="secondary">{course.status}</Badge>
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight leading-tight">{course.title}</h1>
          {course.description && (
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-lg">{course.description}</p>
          )}
        </div>

        {/* Stats column */}
        <div className="col-span-12 sm:col-span-5 sm:border-l sm:border-border sm:pl-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Target className="h-3 w-3" /> Topics
              </div>
              <p className="mt-1.5 font-display text-2xl font-bold">{topics.length}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <Clock className="h-3 w-3" /> Studied
              </div>
              <p className="mt-1.5 font-display text-2xl font-bold">{formatMinutes(totalMinutes)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <BookOpen className="h-3 w-3" /> Mastered
              </div>
              <p className="mt-1.5 font-display text-2xl font-bold">{masteredCount}<span className="text-sm font-normal text-muted-foreground">/{topics.length}</span></p>
            </div>
          </div>

          {course.target_hours > 0 && (
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Toward {course.target_hours}h target</span>
                <span className="font-medium tabular-nums">{Math.round(progress)}%</span>
              </div>
              <AnimatedProgress value={progress} showShimmer />
            </div>
          )}
        </div>
      </div>

      {/* Topics section */}
      <PageHeader title="Topics" description="Break down your course into focused study areas.">
        <Button onClick={() => { setEditingTopic(null); setDialogOpen(true); }} size="sm">
          <Plus className="mr-2 h-4 w-4" /> New Topic
        </Button>
      </PageHeader>

      {topics.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No topics yet"
          description="Add topics to break down your course into manageable pieces."
          actionLabel="Add Topic"
          onAction={() => { setEditingTopic(null); setDialogOpen(true); }}
        />
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {topics.map((topic, idx) => {
            const topicSessionMinutes = sessions
              .filter((s) => s.topic_id === topic.id)
              .reduce((sum, s) => sum + s.duration_minutes, 0);
            const reviewInfo = topic.next_review_date
              ? (() => {
                  const days = differenceInCalendarDays(parseISO(topic.next_review_date), new Date());
                  if (days < 0) return { label: `${Math.abs(days)}d overdue`, color: 'text-destructive' };
                  if (days === 0) return { label: 'Due today', color: 'text-warning' };
                  return { label: `In ${days}d`, color: 'text-muted-foreground' };
                })()
              : null;

            return (
              <div key={topic.id} className="group relative py-4 hover:bg-muted/20 transition-colors -mx-2 px-2">
                <div className="flex items-center gap-4">
                  <span className="font-display text-lg font-bold text-muted-foreground/30 tabular-nums shrink-0 w-8">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <Link href={`/topics/${topic.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">{topic.title}</h3>
                      <Badge className={`text-[9px] px-1.5 h-4 ${TOPIC_STATUS_COLORS[topic.status]}`} variant="secondary">
                        {TOPIC_STATUS_LABELS[topic.status]}
                      </Badge>
                    </div>
                    {topic.description && (
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{topic.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4">
                      <ConfidenceIndicator level={topic.confidence_level} size="sm" />
                      {reviewInfo && (
                        <span className={`text-xs font-medium ${reviewInfo.color}`}>{reviewInfo.label}</span>
                      )}
                      {topicSessionMinutes > 0 && (
                        <span className="text-xs text-muted-foreground">{formatMinutes(topicSessionMinutes)}</span>
                      )}
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingTopic(topic); setDialogOpen(true); }}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTopicId(topic.id)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TopicFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={course.id}
        topic={editingTopic}
        onSaved={loadData}
      />

      <ConfirmDialog
        open={!!deleteTopicId}
        onOpenChange={(open) => !open && setDeleteTopicId(null)}
        title="Delete Topic?"
        description="This will permanently delete the topic and all its study sessions, notes, and quiz scores."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteTopic}
      />
    </div>
  );
}
