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
import { DynamicIcon } from '@/components/dynamic-icon';
import { COURSE_COLORS, COURSE_ICONS, COURSE_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { coursesApi } from '@/lib/api';
import type { Course, CourseStatus } from '@/types';

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: Course | null;
  onSaved?: () => void;
}

export function CourseFormDialog({ open, onOpenChange, course, onSaved }: CourseFormDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [icon, setIcon] = useState('BookOpen');
  const [status, setStatus] = useState<CourseStatus>('Active');
  const [targetHours, setTargetHours] = useState('0');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (course) {
      setTitle(course.title);
      setDescription(course.description);
      setColor(course.color);
      setIcon(course.icon);
      setStatus(course.status);
      setTargetHours(String(course.target_hours));
    } else {
      setTitle('');
      setDescription('');
      setColor('blue');
      setIcon('BookOpen');
      setStatus('Active');
      setTargetHours('0');
    }
  }, [course, open]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      const input = {
        title: title.trim(),
        description: description.trim(),
        color,
        icon,
        status,
        target_hours: parseInt(targetHours, 10) || 0,
      };
      if (course) {
        await coursesApi.update(course.id, input);
        toast.success('Course updated');
      } else {
        await coursesApi.create(input);
        toast.success('Course created');
      }
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>{course ? 'Edit Course' : 'New Course'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. React Deep Dive"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will you learn?"
              rows={3}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COURSE_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  className={cn(
                    'h-8 w-8 rounded-lg transition-all',
                    c.class,
                    color === c.name && 'ring-2 ring-offset-2 ring-offset-background ring-primary scale-110'
                  )}
                  aria-label={c.name}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="grid grid-cols-8 gap-2 rounded-lg border border-border p-3">
              {COURSE_ICONS.map((iconName) => (
                <button
                  key={iconName}
                  onClick={() => setIcon(iconName)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-md transition-all',
                    icon === iconName
                      ? 'bg-primary text-primary-foreground scale-110'
                      : 'hover:bg-muted text-muted-foreground'
                  )}
                  aria-label={iconName}
                >
                  <DynamicIcon name={iconName} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as CourseStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COURSE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetHours">Target Hours</Label>
              <Input
                id="targetHours"
                type="number"
                min="0"
                value={targetHours}
                onChange={(e) => setTargetHours(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : course ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
