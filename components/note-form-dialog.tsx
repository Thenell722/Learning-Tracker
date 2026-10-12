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
import { toast } from 'sonner';
import { notesApi } from '@/lib/api';
import type { Note } from '@/types';

interface NoteFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId?: string;
  sessionId?: string | null;
  note?: Note | null;
  onSaved?: () => void;
}

export function NoteFormDialog({
  open,
  onOpenChange,
  topicId,
  sessionId,
  note,
  onSaved,
}: NoteFormDialogProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [note, open]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!topicId) {
      toast.error('Topic is required');
      return;
    }
    setSaving(true);
    try {
      const input = {
        topic_id: topicId,
        session_id: sessionId ?? null,
        title: title.trim(),
        content: content.trim(),
      };
      if (note) {
        await notesApi.update(note.id, input);
        toast.success('Note updated');
      } else {
        await notesApi.create(input);
        toast.success('Note created');
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'New Note'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Key takeaways"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your notes here..."
              rows={6}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : note ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
