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
import { toast } from 'sonner';
import { quizzesApi, topicsApi } from '@/lib/api';
import { format } from 'date-fns';
import type { QuizScore, Topic } from '@/types';

interface QuizFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTopicId?: string;
  quiz?: QuizScore | null;
  onSaved?: () => void;
}

export function QuizFormDialog({
  open,
  onOpenChange,
  defaultTopicId,
  quiz,
  onSaved,
}: QuizFormDialogProps) {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState('');
  const [score, setScore] = useState('0');
  const [total, setTotal] = useState('10');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    topicsApi.list().then(setTopics).catch(() => {});
  }, []);

  useEffect(() => {
    if (quiz) {
      setTopicId(quiz.topic_id);
      setScore(String(quiz.score));
      setTotal(String(quiz.total_questions));
      setDate(quiz.quiz_date);
      setNotes(quiz.notes);
    } else {
      setTopicId(defaultTopicId ?? '');
      setScore('0');
      setTotal('10');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setNotes('');
    }
  }, [quiz, defaultTopicId, open]);

  const percentage = total && parseInt(total, 10) > 0
    ? Math.round((parseInt(score, 10) / parseInt(total, 10)) * 100)
    : 0;

  const handleSave = async () => {
    if (!topicId) {
      toast.error('Please select a topic');
      return;
    }
    const totalNum = parseInt(total, 10);
    const scoreNum = parseInt(score, 10);
    if (totalNum < 1) {
      toast.error('Total questions must be at least 1');
      return;
    }
    if (scoreNum > totalNum) {
      toast.error('Score cannot exceed total questions');
      return;
    }
    setSaving(true);
    try {
      const input = {
        topic_id: topicId,
        score: scoreNum,
        total_questions: totalNum,
        quiz_date: date,
        notes: notes.trim(),
      };
      if (quiz) {
        await quizzesApi.update(quiz.id, input);
        toast.success('Quiz score updated');
      } else {
        await quizzesApi.create(input);
        toast.success('Quiz score recorded');
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to save quiz score');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{quiz ? 'Edit Quiz Score' : 'Record Quiz Score'}</DialogTitle>
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
              <Label htmlFor="quiz-score">Score</Label>
              <Input id="quiz-score" type="number" min="0" value={score} onChange={(e) => setScore(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quiz-total">Total Questions</Label>
              <Input id="quiz-total" type="number" min="1" value={total} onChange={(e) => setTotal(e.target.value)} />
            </div>
          </div>

          {percentage > 0 && (
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <span className="text-2xl font-bold text-primary">{percentage}%</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="quiz-date">Date</Label>
            <Input id="quiz-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quiz-notes">Notes</Label>
            <Textarea
              id="quiz-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go? What to improve?"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : quiz ? 'Update' : 'Record'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
