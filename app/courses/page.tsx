'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, BookOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { CourseFormDialog } from '@/components/course-form-dialog';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { DynamicIcon } from '@/components/dynamic-icon';
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
import { getColorClasses, COURSE_STATUS_COLORS } from '@/lib/constants';
import { formatMinutes } from '@/lib/format';
import { toast } from 'sonner';
import type { Course, Topic, StudySession } from '@/types';

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [c, t, s] = await Promise.all([
        coursesApi.list(),
        topicsApi.list(),
        sessionsApi.list(),
      ]);
      setCourses(c);
      setTopics(t);
      setSessions(s);
    } catch {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await coursesApi.remove(deleteId);
      toast.success('Course deleted');
      setDeleteId(null);
      loadData();
    } catch {
      toast.error('Failed to delete course');
    }
  };

  const getCourseStats = (courseId: string) => {
    const courseTopics = topics.filter((t) => t.course_id === courseId);
    const topicIds = courseTopics.map((t) => t.id);
    const courseSessions = sessions.filter((s) => topicIds.includes(s.topic_id));
    const totalMinutes = courseSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
    return { topicCount: courseTopics.length, totalMinutes };
  };

  return (
    <div>
      <PageHeader title="Courses" description="Your learning library — each course is a collection of topics, study sessions, and notes.">
        <Button
          onClick={() => {
            setEditingCourse(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> New Course
        </Button>
      </PageHeader>

      {loading ? (
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="py-6 flex gap-6 animate-pulse">
              <div className="h-12 w-12 rounded-sm bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-1/3 rounded-sm bg-muted" />
                <div className="h-3 w-1/2 rounded-sm bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create your first course to start tracking your learning journey."
          actionLabel="Create Course"
          onAction={() => {
            setEditingCourse(null);
            setDialogOpen(true);
          }}
        />
      ) : (
        <div className="divide-y divide-border border-y border-border animate-fade-in">
          {courses.map((course, idx) => {
            const stats = getCourseStats(course.id);
            const colorClasses = getColorClasses(course.color);
            const progress = course.target_hours > 0
              ? Math.min(100, (stats.totalMinutes / 60 / course.target_hours) * 100)
              : 0;
            return (
              <div
                key={course.id}
                className="group relative py-6 hover:bg-muted/20 transition-colors -mx-2 px-2 animate-fade-in"
                style={{ animationDelay: `${idx * 0.04}s` }}
              >
                <div className="flex items-start gap-5">
                  {/* Index number + icon */}
                  <div className="shrink-0 flex flex-col items-center gap-2 pt-1">
                    <span className="font-display text-2xl font-bold text-muted-foreground/30 tabular-nums">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div className={`flex h-10 w-10 items-center justify-center ${colorClasses.light}`}>
                      <DynamicIcon name={course.icon} className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Main content */}
                  <Link href={`/courses/${course.id}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-xl font-semibold tracking-tight truncate group-hover:text-primary transition-colors">
                        {course.title}
                      </h3>
                      <Badge className={`text-[9px] px-1.5 h-4 ${COURSE_STATUS_COLORS[course.status]}`} variant="secondary">
                        {course.status}
                      </Badge>
                    </div>
                    {course.description && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground leading-relaxed max-w-2xl">
                        {course.description}
                      </p>
                    )}

                    {/* Stats row */}
                    <div className="mt-4 flex items-center gap-6">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-lg font-bold tabular-nums">{stats.topicCount}</span>
                        <span className="text-xs text-muted-foreground">topics</span>
                      </div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-display text-lg font-bold tabular-nums">{formatMinutes(stats.totalMinutes)}</span>
                        <span className="text-xs text-muted-foreground">studied</span>
                      </div>
                      {course.target_hours > 0 && (
                        <div className="flex items-center gap-2 min-w-[120px] flex-1 max-w-xs">
                          <AnimatedProgress value={progress} className="flex-1" />
                          <span className="text-xs font-medium text-muted-foreground tabular-nums whitespace-nowrap">
                            {Math.round(progress)}% of {course.target_hours}h
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="shrink-0">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setEditingCourse(course); setDialogOpen(true); }}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(course.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={editingCourse}
        onSaved={loadData}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Course?"
        description="This will permanently delete the course and all its topics, sessions, notes, and quiz scores."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  );
}
