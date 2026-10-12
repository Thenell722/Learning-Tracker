'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfidenceIndicator } from '@/components/confidence-indicator';
import { suggestReviewDate } from '@/lib/spaced-repetition';
import { toast } from 'sonner';
import { topicsApi } from '@/lib/api';
import { TOPIC_STATUSES } from '@/lib/constants';
import { format } from 'date-fns';
import type { Topic, TopicStatus } from '@/types';

interface TopicFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  topic?: Topic | null;
  onSaved?: () => void;
}

export function TopicFormDialog({ open, onOpenChange, courseId, topic, onSaved }: TopicFormDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TopicStatus>('NotStarted');
  const [confidence, setConfidence] = useState('1');
  const [reviewDate, setReviewDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (topic) {
      setTitle(topic.title);
      setDescription(topic.description);
      setStatus(topic.status);
      setConfidence(String(topic.confidence_level));
      setReviewDate(topic.next_review_date ?? '');
    } else {
      setTitle('');
      setDescription('');
      setStatus('NotStarted');
      setConfidence('1');
      setReviewDate('');
    }
  }, [topic, open]);

  const handleSuggestReview = () => {
    const suggested = suggestReviewDate(parseInt(confidence, 10));
    setReviewDate(format(suggested, 'yyyy-MM-dd'));
    toast.success(`Suggested review: ${format(suggested, 'MMM d, yyyy')}`);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const input = {
        course_id: courseId,
        title: title.trim(),
        description: description.trim(),
        status,
        confidence_level: parseInt(confidence, 10) as 1 | 2 | 3 | 4 | 5,
        next_review_date: reviewDate || null,
      };
      if (topic) {
        await topicsApi.update(topic.id, input);
        toast.success('Topic updated');
      } else {
        await topicsApi.create(input);
        toast.success('Topic created');
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{topic ? 'Edit Topic' : 'New Topic'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="topic-title">Title</Label>
            <Input
              id="topic-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hooks Fundamentals"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="topic-desc">Description</Label>
            <Textarea
              id="topic-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this topic cover?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as TopicStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOPIC_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s === 'NotStarted' ? 'Not Started' : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Confidence Level</Label>
              <Select value={confidence} onValueChange={setConfidence}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>Level {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ConfidenceIndicator level={parseInt(confidence, 10)} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="review-date">Next Review Date</Label>
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={handleSuggestReview}>
                Auto-suggest
              </Button>
            </div>
            <Input
              id="review-date"
              type="date"
              value={reviewDate}
              onChange={(e) => setReviewDate(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : topic ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
