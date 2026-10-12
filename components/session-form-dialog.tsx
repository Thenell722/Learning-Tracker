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
import { toast } from 'sonner';
import { sessionsApi, topicsApi } from '@/lib/api';
import { format } from 'date-fns';
import type { StudySession, Topic } from '@/types';

interface SessionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTopicId?: string;
  session?: StudySession | null;
  onSaved?: () => void;
}

export function SessionFormDialog({
  open,
  onOpenChange,
  defaultTopicId,
  session,
  onSaved,
}: SessionFormDialogProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [duration, setDuration] = useState('25');
  const [summary, setSummary] = useState('');
  const [confBefore, setConfBefore] = useState('1');
  const [confAfter, setConfAfter] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    topicsApi.list().then(setTopics).catch(() => {});
  }, []);

  useEffect(() => {
    if (session) {
      setTopicId(session.topic_id);
      setDate(session.session_date);
      setDuration(String(session.duration_minutes));
      setSummary(session.summary);
      setConfBefore(String(session.confidence_before));
      setConfAfter(String(session.confidence_after));
    } else {
      setTopicId(defaultTopicId ?? '');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setDuration('25');
      setSummary('');
      setConfBefore('1');
      setConfAfter('1');
    }
  }, [session, defaultTopicId, open]);

  const handleSave = async () => {
    if (!topicId) {
      toast.error('Please select a topic');
      return;
    }
    setSaving(true);
    try {
      const input = {
        topic_id: topicId,
        session_date: date,
        duration_minutes: parseInt(duration, 10) || 0,
        summary: summary.trim(),
        confidence_before: parseInt(confBefore, 10),
        confidence_after: parseInt(confAfter, 10),
      };
      if (session) {
        await sessionsApi.update(session.id, input);
        toast.success('Session updated');
      } else {
        await sessionsApi.create(input);
        // Also update the topic's confidence level to match the session's after-confidence
        await topicsApi.update(topicId, {
          confidence_level: parseInt(confAfter, 10) as 1 | 2 | 3 | 4 | 5,
          status: parseInt(confAfter, 10) >= 5 ? 'Mastered' as const : parseInt(confAfter, 10) >= 3 ? 'Learning' as const : 'NotStarted' as const,
        });
        toast.success('Session logged');
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to save session');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{session ? 'Edit Study Session' : 'Log Study Session'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Topic</Label>
            <Select value={topicId} onValueChange={setTopicId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="session-date">Date</Label>
              <Input id="session-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input id="duration" type="number" min="0" max="1440" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="What did you study?"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Confidence Before</Label>
              <Select value={confBefore} onValueChange={setConfBefore}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>Level {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ConfidenceIndicator level={parseInt(confBefore, 10)} size="sm" />
            </div>
            <div className="space-y-1.5">
              <Label>Confidence After</Label>
              <Select value={confAfter} onValueChange={setConfAfter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>Level {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ConfidenceIndicator level={parseInt(confAfter, 10)} size="sm" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : session ? 'Update' : 'Log Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
