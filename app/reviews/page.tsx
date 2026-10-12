'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { CalendarCheck, AlertCircle, Clock, CheckCircle, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { EmptyState } from '@/components/empty-state';
import { RowSkeleton } from '@/components/skeletons';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { DynamicIcon } from '@/components/dynamic-icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { reviewsApi } from '@/lib/api';
import { getColorClasses, TOPIC_STATUS_LABELS } from '@/lib/constants';
import { toast } from 'sonner';
import type { Topic, Course } from '@/types';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';

type ReviewTopic = Topic & { course?: Pick<Course, 'id' | 'title' | 'color' | 'icon'> };

export default function ReviewsPage() {
  const [dueReviews, setDueReviews] = useState<ReviewTopic[]>([]);
  const [upcomingReviews, setUpcomingReviews] = useState<ReviewTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [completeTopic, setCompleteTopic] = useState<ReviewTopic | null>(null);
  const [newConfidence, setNewConfidence] = useState('3');
  const [completing, setCompleting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [due, upcoming] = await Promise.all([
        reviewsApi.list('due'),
        reviewsApi.list('upcoming'),
      ]);
      setDueReviews(due as ReviewTopic[]);
      setUpcomingReviews(upcoming as ReviewTopic[]);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleComplete = async () => {
    if (!completeTopic) return;
    setCompleting(true);
    try {
      await reviewsApi.complete(completeTopic.id, parseInt(newConfidence, 10));
      toast.success('Review completed! Next review scheduled.');
      setCompleteTopic(null);
      setNewConfidence('3');
      loadData();
    } catch {
      toast.error('Failed to complete review');
    } finally {
      setCompleting(false);
    }
  };

  const renderReviewItem = (topic: ReviewTopic, idx: number) => {
    const colorClasses = getColorClasses(topic.course?.color ?? 'blue');
    const days = topic.next_review_date
      ? differenceInCalendarDays(parseISO(topic.next_review_date), new Date())
      : 0;
    const overdue = days < 0;
    const dueToday = days === 0;

    return (
      <div
        key={topic.id}
        className="group py-4 hover:bg-muted/20 transition-colors -mx-2 px-2 animate-fade-in"
        style={{ animationDelay: `${idx * 0.04}s` }}
      >
        <div className="flex items-center gap-4">
          <span className="font-display text-lg font-bold text-muted-foreground/30 tabular-nums shrink-0 w-7">
            {String(idx + 1).padStart(2, '0')}
          </span>
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center ${colorClasses.light}`}>
            <DynamicIcon name={topic.course?.icon ?? 'BookOpen'} className="h-4 w-4" />
          </div>
          <Link href={`/topics/${topic.id}`} className="flex-1 min-w-0">
            <p className="truncate font-medium text-sm group-hover:text-primary transition-colors">{topic.title}</p>
            <p className="truncate text-xs text-muted-foreground">{topic.course?.title}</p>
            <div className="mt-1.5 flex items-center gap-3">
              <ConfidenceIndicator level={topic.confidence_level} size="sm" />
              <span className="text-xs text-muted-foreground">{TOPIC_STATUS_LABELS[topic.status]}</span>
            </div>
          </Link>
          <div className="flex flex-col items-end gap-2 shrink-0">
            <Badge
              variant={overdue ? 'destructive' : dueToday ? 'secondary' : 'outline'}
              className={`text-[9px] h-4 px-1.5 ${dueToday ? 'bg-warning/15 text-warning' : ''}`}
            >
              {overdue ? `${Math.abs(days)}d overdue` : dueToday ? 'Due today' : `In ${days}d`}
            </Badge>
            {(overdue || dueToday) && (
              <Button
                size="sm"
                variant="default"
                className="h-6 text-xs"
                onClick={() => { setCompleteTopic(topic); setNewConfidence(String(topic.confidence_level)); }}
              >
                <CheckCircle className="mr-1 h-3 w-3" /> Mark Done
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader title="Reviews" description="Spaced repetition schedule — review topics at increasing intervals based on your confidence." />

      {loading ? (
        <RowSkeleton count={4} />
      ) : (
        <Tabs defaultValue="due">
          <TabsList className="mb-6 border-b border-border bg-transparent p-0 h-auto gap-6">
            <TabsTrigger value="due" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 pt-0 text-sm font-medium gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> Due & Overdue
              {dueReviews.length > 0 && <Badge variant="destructive" className="ml-1 text-[9px] h-4 px-1.5">{dueReviews.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-2 pt-0 text-sm font-medium gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Upcoming
              {upcomingReviews.length > 0 && <span className="ml-1 text-xs text-muted-foreground">{upcomingReviews.length}</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="due">
            {dueReviews.length === 0 ? (
              <EmptyState
                icon={CheckCircle}
                title="All caught up!"
                description="No reviews are due. Great job staying on top of your learning."
              />
            ) : (
              <div className="divide-y divide-border border-y border-border">
                {dueReviews.map((t, i) => renderReviewItem(t, i))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming">
            {upcomingReviews.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="No upcoming reviews"
                description="Set review dates on your topics to see them scheduled here."
              />
            ) : (
              <div className="divide-y divide-border border-y border-border">
                {upcomingReviews.map((t, i) => renderReviewItem(t, i))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Complete review dialog */}
      <Dialog open={!!completeTopic} onOpenChange={(o) => !o && setCompleteTopic(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Complete Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              How confident do you feel about <span className="font-medium text-foreground">{completeTopic?.title}</span>? The next review will be auto-scheduled based on your confidence.
            </p>
            <div className="space-y-1.5">
              <Label>New Confidence Level</Label>
              <Select value={newConfidence} onValueChange={setNewConfidence}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>Level {n} — {['Very Low', 'Low', 'Medium', 'High', 'Very High'][n - 1]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <ConfidenceIndicator level={parseInt(newConfidence, 10)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTopic(null)}>Cancel</Button>
            <Button onClick={handleComplete} disabled={completing}>
              {completing ? 'Saving...' : 'Complete & Schedule Next'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
